"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.flush = flush;
exports.cleanup = cleanup;
exports.getLogsForReport = getLogsForReport;

/*
Copyright 2017 OpenMarket Ltd
Copyright 2018 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// This module contains all the code needed to log the console, persist it to
// disk and submit bug reports. Rationale is as follows:
//  - Monkey-patching the console is preferable to having a log library because
//    we can catch logs by other libraries more easily, without having to all
//    depend on the same log framework / pass the logger around.
//  - We use IndexedDB to persists logs because it has generous disk space
//    limits compared to local storage. IndexedDB does not work in incognito
//    mode, in which case this module will not be able to write logs to disk.
//    However, the logs will still be stored in-memory, so can still be
//    submitted in a bug report should the user wish to: we can also store more
//    logs in-memory than in local storage, which does work in incognito mode.
//    We also need to handle the case where there are 2+ tabs. Each JS runtime
//    generates a random string which serves as the "ID" for that tab/session.
//    These IDs are stored along with the log lines.
//  - Bug reports are sent as a POST over HTTPS: it purposefully does not use
//    Matrix as bug reports may be made when Matrix is not responsive (which may
//    be the cause of the bug). We send the most recent N MB of UTF-8 log data,
//    starting with the most recent, which we know because the "ID"s are
//    actually timestamps. We then purge the remaining logs. We also do this
//    purge on startup to prevent logs from accumulating.
// the frequency with which we flush to indexeddb
const FLUSH_RATE_MS = 30 * 1000; // the length of log data we keep in indexeddb (and include in the reports)

const MAX_LOG_SIZE = 1024 * 1024 * 5; // 5 MB
// A class which monkey-patches the global console and stores log lines.

class ConsoleLogger {
  constructor() {
    this.logs = "";
  }

  monkeyPatch(consoleObj) {
    // Monkey-patch console logging
    const consoleFunctionsToLevels = {
      log: "I",
      info: "I",
      warn: "W",
      error: "E"
    };
    Object.keys(consoleFunctionsToLevels).forEach(fnName => {
      const level = consoleFunctionsToLevels[fnName];
      const originalFn = consoleObj[fnName].bind(consoleObj);

      consoleObj[fnName] = (...args) => {
        this.log(level, ...args);
        originalFn(...args);
      };
    });
  }

  log(level, ...args) {
    // We don't know what locale the user may be running so use ISO strings
    const ts = new Date().toISOString(); // Convert objects and errors to helpful things

    args = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + (arg.stack ? "\n".concat(arg.stack) : '');
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          // In development, it can be useful to log complex cyclic
          // objects to the console for inspection. This is fine for
          // the console, but default `stringify` can't handle that.
          // We workaround this by using a special replacer function
          // to only log values of the root object and avoid cycles.
          return JSON.stringify(arg, (key, value) => {
            if (key && typeof value === "object") {
              return "<object>";
            }

            return value;
          });
        }
      } else {
        return arg;
      }
    }); // Some browsers support string formatting which we're not doing here
    // so the lines are a little more ugly but easy to implement / quick to
    // run.
    // Example line:
    // 2017-01-18T11:23:53.214Z W Failed to set badge count

    let line = "".concat(ts, " ").concat(level, " ").concat(args.join(' '), "\n"); // Do some cleanup

    line = line.replace(/token=[a-zA-Z0-9-]+/gm, 'token=xxxxx'); // Using + really is the quickest way in JS
    // http://jsperf.com/concat-vs-plus-vs-join

    this.logs += line;
  }
  /**
   * Retrieve log lines to flush to disk.
   * @param {boolean} keepLogs True to not delete logs after flushing.
   * @return {string} \n delimited log lines to flush.
   */


  flush(keepLogs) {
    // The ConsoleLogger doesn't care how these end up on disk, it just
    // flushes them to the caller.
    if (keepLogs) {
      return this.logs;
    }

    const logsToFlush = this.logs;
    this.logs = "";
    return logsToFlush;
  }

} // A class which stores log lines in an IndexedDB instance.


class IndexedDBLogStore {
  constructor(indexedDB, logger) {
    this.indexedDB = indexedDB;
    this.logger = logger;
    this.id = "instance-" + Math.random() + Date.now();
    this.index = 0;
    this.db = null; // these promises are cleared as soon as fulfilled

    this.flushPromise = null; // set if flush() is called whilst one is ongoing

    this.flushAgainPromise = null;
  }
  /**
   * @return {Promise} Resolves when the store is ready.
   */


  connect() {
    const req = this.indexedDB.open("logs");
    return new Promise((resolve, reject) => {
      req.onsuccess = event => {
        this.db = event.target.result; // Periodically flush logs to local storage / indexeddb

        setInterval(this.flush.bind(this), FLUSH_RATE_MS);
        resolve();
      };

      req.onerror = event => {
        const err = "Failed to open log database: " + event.target.error.name;
        console.error(err);
        reject(new Error(err));
      }; // First time: Setup the object store


      req.onupgradeneeded = event => {
        const db = event.target.result;
        const logObjStore = db.createObjectStore("logs", {
          keyPath: ["id", "index"]
        }); // Keys in the database look like: [ "instance-148938490", 0 ]
        // Later on we need to query everything based on an instance id.
        // In order to do this, we need to set up indexes "id".

        logObjStore.createIndex("id", "id", {
          unique: false
        });
        logObjStore.add(this._generateLogEntry(new Date() + " ::: Log database was created."));
        const lastModifiedStore = db.createObjectStore("logslastmod", {
          keyPath: "id"
        });
        lastModifiedStore.add(this._generateLastModifiedTime());
      };
    });
  }
  /**
   * Flush logs to disk.
   *
   * There are guards to protect against race conditions in order to ensure
   * that all previous flushes have completed before the most recent flush.
   * Consider without guards:
   *  - A calls flush() periodically.
   *  - B calls flush() and wants to send logs immediately afterwards.
   *  - If B doesn't wait for A's flush to complete, B will be missing the
   *    contents of A's flush.
   * To protect against this, we set 'flushPromise' when a flush is ongoing.
   * Subsequent calls to flush() during this period will chain another flush,
   * then keep returning that same chained flush.
   *
   * This guarantees that we will always eventually do a flush when flush() is
   * called.
   *
   * @return {Promise} Resolved when the logs have been flushed.
   */


  flush() {
    // check if a flush() operation is ongoing
    if (this.flushPromise) {
      if (this.flushAgainPromise) {
        // this is the 3rd+ time we've called flush() : return the same promise.
        return this.flushAgainPromise;
      } // queue up a flush to occur immediately after the pending one completes.


      this.flushAgainPromise = this.flushPromise.then(() => {
        return this.flush();
      }).then(() => {
        this.flushAgainPromise = null;
      });
      return this.flushAgainPromise;
    } // there is no flush promise or there was but it has finished, so do
    // a brand new one, destroying the chain which may have been built up.


    this.flushPromise = new Promise((resolve, reject) => {
      if (!this.db) {
        // not connected yet or user rejected access for us to r/w to the db.
        reject(new Error("No connected database"));
        return;
      }

      const lines = this.logger.flush();

      if (lines.length === 0) {
        resolve();
        return;
      }

      const txn = this.db.transaction(["logs", "logslastmod"], "readwrite");
      const objStore = txn.objectStore("logs");

      txn.oncomplete = event => {
        resolve();
      };

      txn.onerror = event => {
        console.error("Failed to flush logs : ", event);
        reject(new Error("Failed to write logs: " + event.target.errorCode));
      };

      objStore.add(this._generateLogEntry(lines));
      const lastModStore = txn.objectStore("logslastmod");
      lastModStore.put(this._generateLastModifiedTime());
    }).then(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }
  /**
   * Consume the most recent logs and return them. Older logs which are not
   * returned are deleted at the same time, so this can be called at startup
   * to do house-keeping to keep the logs from growing too large.
   *
   * @return {Promise<Object[]>} Resolves to an array of objects. The array is
   * sorted in time (oldest first) based on when the log file was created (the
   * log ID). The objects have said log ID in an "id" field and "lines" which
   * is a big string with all the new-line delimited logs.
   */


  async consume() {
    const db = this.db; // Returns: a string representing the concatenated logs for this ID.
    // Stops adding log fragments when the size exceeds maxSize

    function fetchLogs(id, maxSize) {
      const objectStore = db.transaction("logs", "readonly").objectStore("logs");
      return new Promise((resolve, reject) => {
        const query = objectStore.index("id").openCursor(IDBKeyRange.only(id), 'prev');
        let lines = '';

        query.onerror = event => {
          reject(new Error("Query failed: " + event.target.errorCode));
        };

        query.onsuccess = event => {
          const cursor = event.target.result;

          if (!cursor) {
            resolve(lines);
            return; // end of results
          }

          lines = cursor.value.lines + lines;

          if (lines.length >= maxSize) {
            resolve(lines);
          } else {
            cursor.continue();
          }
        };
      });
    } // Returns: A sorted array of log IDs. (newest first)


    function fetchLogIds() {
      // To gather all the log IDs, query for all records in logslastmod.
      const o = db.transaction("logslastmod", "readonly").objectStore("logslastmod");
      return selectQuery(o, undefined, cursor => {
        return {
          id: cursor.value.id,
          ts: cursor.value.ts
        };
      }).then(res => {
        // Sort IDs by timestamp (newest first)
        return res.sort((a, b) => {
          return b.ts - a.ts;
        }).map(a => a.id);
      });
    }

    function deleteLogs(id) {
      return new Promise((resolve, reject) => {
        const txn = db.transaction(["logs", "logslastmod"], "readwrite");
        const o = txn.objectStore("logs"); // only load the key path, not the data which may be huge

        const query = o.index("id").openKeyCursor(IDBKeyRange.only(id));

        query.onsuccess = event => {
          const cursor = event.target.result;

          if (!cursor) {
            return;
          }

          o.delete(cursor.primaryKey);
          cursor.continue();
        };

        txn.oncomplete = () => {
          resolve();
        };

        txn.onerror = event => {
          reject(new Error("Failed to delete logs for " + "'".concat(id, "' : ").concat(event.target.errorCode)));
        }; // delete last modified entries


        const lastModStore = txn.objectStore("logslastmod");
        lastModStore.delete(id);
      });
    }

    const allLogIds = await fetchLogIds();
    let removeLogIds = [];
    const logs = [];
    let size = 0;

    for (let i = 0; i < allLogIds.length; i++) {
      const lines = await fetchLogs(allLogIds[i], MAX_LOG_SIZE - size); // always add the log file: fetchLogs will truncate once the maxSize we give it is
      // exceeded, so we'll go over the max but only by one fragment's worth.

      logs.push({
        lines: lines,
        id: allLogIds[i]
      });
      size += lines.length; // If fetchLogs truncated we'll now be at or over the size limit,
      // in which case we should stop and remove the rest of the log files.

      if (size >= MAX_LOG_SIZE) {
        // the remaining log IDs should be removed. If we go out of
        // bounds this is just []
        removeLogIds = allLogIds.slice(i + 1);
        break;
      }
    }

    if (removeLogIds.length > 0) {
      console.log("Removing logs: ", removeLogIds); // Don't await this because it's non-fatal if we can't clean up
      // logs.

      Promise.all(removeLogIds.map(id => deleteLogs(id))).then(() => {
        console.log("Removed ".concat(removeLogIds.length, " old logs."));
      }, err => {
        console.error(err);
      });
    }

    return logs;
  }

  _generateLogEntry(lines) {
    return {
      id: this.id,
      lines: lines,
      index: this.index++
    };
  }

  _generateLastModifiedTime() {
    return {
      id: this.id,
      ts: Date.now()
    };
  }

}
/**
 * Helper method to collect results from a Cursor and promiseify it.
 * @param {ObjectStore|Index} store The store to perform openCursor on.
 * @param {IDBKeyRange=} keyRange Optional key range to apply on the cursor.
 * @param {Function} resultMapper A function which is repeatedly called with a
 * Cursor.
 * Return the data you want to keep.
 * @return {Promise<T[]>} Resolves to an array of whatever you returned from
 * resultMapper.
 */


function selectQuery(store, keyRange, resultMapper) {
  const query = store.openCursor(keyRange);
  return new Promise((resolve, reject) => {
    const results = [];

    query.onerror = event => {
      reject(new Error("Query failed: " + event.target.errorCode));
    }; // collect results


    query.onsuccess = event => {
      const cursor = event.target.result;

      if (!cursor) {
        resolve(results);
        return; // end of results
      }

      results.push(resultMapper(cursor));
      cursor.continue();
    };
  });
}
/**
 * Configure rage shaking support for sending bug reports.
 * Modifies globals.
 * @return {Promise} Resolves when set up.
 */


function init() {
  if (global.mx_rage_initPromise) {
    return global.mx_rage_initPromise;
  }

  global.mx_rage_logger = new ConsoleLogger();
  global.mx_rage_logger.monkeyPatch(window.console); // just *accessing* indexedDB throws an exception in firefox with
  // indexeddb disabled.

  let indexedDB;

  try {
    indexedDB = window.indexedDB;
  } catch (e) {}

  if (indexedDB) {
    global.mx_rage_store = new IndexedDBLogStore(indexedDB, global.mx_rage_logger);
    global.mx_rage_initPromise = global.mx_rage_store.connect();
    return global.mx_rage_initPromise;
  }

  global.mx_rage_initPromise = Promise.resolve();
  return global.mx_rage_initPromise;
}

function flush() {
  if (!global.mx_rage_store) {
    return;
  }

  global.mx_rage_store.flush();
}
/**
 * Clean up old logs.
 * @return Promise Resolves if cleaned logs.
 */


async function cleanup() {
  if (!global.mx_rage_store) {
    return;
  }

  await global.mx_rage_store.consume();
}
/**
 * Get a recent snapshot of the logs, ready for attaching to a bug report
 *
 * @return {Array<{lines: string, id, string}>}  list of log data
 */


async function getLogsForReport() {
  if (!global.mx_rage_logger) {
    throw new Error("No console logger, did you forget to call init()?");
  } // If in incognito mode, store is null, but we still want bug report
  // sending to work going off the in-memory console logs.


  if (global.mx_rage_store) {
    // flush most recent logs
    await global.mx_rage_store.flush();
    return await global.mx_rage_store.consume();
  } else {
    return [{
      lines: global.mx_rage_logger.flush(true),
      id: "-"
    }];
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yYWdlc2hha2UvcmFnZXNoYWtlLmpzIl0sIm5hbWVzIjpbIkZMVVNIX1JBVEVfTVMiLCJNQVhfTE9HX1NJWkUiLCJDb25zb2xlTG9nZ2VyIiwiY29uc3RydWN0b3IiLCJsb2dzIiwibW9ua2V5UGF0Y2giLCJjb25zb2xlT2JqIiwiY29uc29sZUZ1bmN0aW9uc1RvTGV2ZWxzIiwibG9nIiwiaW5mbyIsIndhcm4iLCJlcnJvciIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiZm5OYW1lIiwibGV2ZWwiLCJvcmlnaW5hbEZuIiwiYmluZCIsImFyZ3MiLCJ0cyIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsIm1hcCIsImFyZyIsIkVycm9yIiwibWVzc2FnZSIsInN0YWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsImUiLCJrZXkiLCJ2YWx1ZSIsImxpbmUiLCJqb2luIiwicmVwbGFjZSIsImZsdXNoIiwia2VlcExvZ3MiLCJsb2dzVG9GbHVzaCIsIkluZGV4ZWREQkxvZ1N0b3JlIiwiaW5kZXhlZERCIiwibG9nZ2VyIiwiaWQiLCJNYXRoIiwicmFuZG9tIiwibm93IiwiaW5kZXgiLCJkYiIsImZsdXNoUHJvbWlzZSIsImZsdXNoQWdhaW5Qcm9taXNlIiwiY29ubmVjdCIsInJlcSIsIm9wZW4iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm9uc3VjY2VzcyIsImV2ZW50IiwidGFyZ2V0IiwicmVzdWx0Iiwic2V0SW50ZXJ2YWwiLCJvbmVycm9yIiwiZXJyIiwibmFtZSIsImNvbnNvbGUiLCJvbnVwZ3JhZGVuZWVkZWQiLCJsb2dPYmpTdG9yZSIsImNyZWF0ZU9iamVjdFN0b3JlIiwia2V5UGF0aCIsImNyZWF0ZUluZGV4IiwidW5pcXVlIiwiYWRkIiwiX2dlbmVyYXRlTG9nRW50cnkiLCJsYXN0TW9kaWZpZWRTdG9yZSIsIl9nZW5lcmF0ZUxhc3RNb2RpZmllZFRpbWUiLCJ0aGVuIiwibGluZXMiLCJsZW5ndGgiLCJ0eG4iLCJ0cmFuc2FjdGlvbiIsIm9ialN0b3JlIiwib2JqZWN0U3RvcmUiLCJvbmNvbXBsZXRlIiwiZXJyb3JDb2RlIiwibGFzdE1vZFN0b3JlIiwicHV0IiwiY29uc3VtZSIsImZldGNoTG9ncyIsIm1heFNpemUiLCJxdWVyeSIsIm9wZW5DdXJzb3IiLCJJREJLZXlSYW5nZSIsIm9ubHkiLCJjdXJzb3IiLCJjb250aW51ZSIsImZldGNoTG9nSWRzIiwibyIsInNlbGVjdFF1ZXJ5IiwidW5kZWZpbmVkIiwicmVzIiwic29ydCIsImEiLCJiIiwiZGVsZXRlTG9ncyIsIm9wZW5LZXlDdXJzb3IiLCJkZWxldGUiLCJwcmltYXJ5S2V5IiwiYWxsTG9nSWRzIiwicmVtb3ZlTG9nSWRzIiwic2l6ZSIsImkiLCJwdXNoIiwic2xpY2UiLCJhbGwiLCJzdG9yZSIsImtleVJhbmdlIiwicmVzdWx0TWFwcGVyIiwicmVzdWx0cyIsImluaXQiLCJnbG9iYWwiLCJteF9yYWdlX2luaXRQcm9taXNlIiwibXhfcmFnZV9sb2dnZXIiLCJ3aW5kb3ciLCJteF9yYWdlX3N0b3JlIiwiY2xlYW51cCIsImdldExvZ3NGb3JSZXBvcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0EsTUFBTUEsYUFBYSxHQUFHLEtBQUssSUFBM0IsQyxDQUVBOztBQUNBLE1BQU1DLFlBQVksR0FBRyxPQUFPLElBQVAsR0FBYyxDQUFuQyxDLENBQXNDO0FBRXRDOztBQUNBLE1BQU1DLGFBQU4sQ0FBb0I7QUFDaEJDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLElBQUwsR0FBWSxFQUFaO0FBQ0g7O0FBRURDLEVBQUFBLFdBQVcsQ0FBQ0MsVUFBRCxFQUFhO0FBQ3BCO0FBQ0EsVUFBTUMsd0JBQXdCLEdBQUc7QUFDN0JDLE1BQUFBLEdBQUcsRUFBRSxHQUR3QjtBQUU3QkMsTUFBQUEsSUFBSSxFQUFFLEdBRnVCO0FBRzdCQyxNQUFBQSxJQUFJLEVBQUUsR0FIdUI7QUFJN0JDLE1BQUFBLEtBQUssRUFBRTtBQUpzQixLQUFqQztBQU1BQyxJQUFBQSxNQUFNLENBQUNDLElBQVAsQ0FBWU4sd0JBQVosRUFBc0NPLE9BQXRDLENBQStDQyxNQUFELElBQVk7QUFDdEQsWUFBTUMsS0FBSyxHQUFHVCx3QkFBd0IsQ0FBQ1EsTUFBRCxDQUF0QztBQUNBLFlBQU1FLFVBQVUsR0FBR1gsVUFBVSxDQUFDUyxNQUFELENBQVYsQ0FBbUJHLElBQW5CLENBQXdCWixVQUF4QixDQUFuQjs7QUFDQUEsTUFBQUEsVUFBVSxDQUFDUyxNQUFELENBQVYsR0FBcUIsQ0FBQyxHQUFHSSxJQUFKLEtBQWE7QUFDOUIsYUFBS1gsR0FBTCxDQUFTUSxLQUFULEVBQWdCLEdBQUdHLElBQW5CO0FBQ0FGLFFBQUFBLFVBQVUsQ0FBQyxHQUFHRSxJQUFKLENBQVY7QUFDSCxPQUhEO0FBSUgsS0FQRDtBQVFIOztBQUVEWCxFQUFBQSxHQUFHLENBQUNRLEtBQUQsRUFBUSxHQUFHRyxJQUFYLEVBQWlCO0FBQ2hCO0FBQ0EsVUFBTUMsRUFBRSxHQUFHLElBQUlDLElBQUosR0FBV0MsV0FBWCxFQUFYLENBRmdCLENBSWhCOztBQUNBSCxJQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0ksR0FBTCxDQUFVQyxHQUFELElBQVM7QUFDckIsVUFBSUEsR0FBRyxZQUFZQyxLQUFuQixFQUEwQjtBQUN0QixlQUFPRCxHQUFHLENBQUNFLE9BQUosSUFBZUYsR0FBRyxDQUFDRyxLQUFKLGVBQWlCSCxHQUFHLENBQUNHLEtBQXJCLElBQStCLEVBQTlDLENBQVA7QUFDSCxPQUZELE1BRU8sSUFBSSxPQUFRSCxHQUFSLEtBQWlCLFFBQXJCLEVBQStCO0FBQ2xDLFlBQUk7QUFDQSxpQkFBT0ksSUFBSSxDQUFDQyxTQUFMLENBQWVMLEdBQWYsQ0FBUDtBQUNILFNBRkQsQ0FFRSxPQUFPTSxDQUFQLEVBQVU7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQU9GLElBQUksQ0FBQ0MsU0FBTCxDQUFlTCxHQUFmLEVBQW9CLENBQUNPLEdBQUQsRUFBTUMsS0FBTixLQUFnQjtBQUN2QyxnQkFBSUQsR0FBRyxJQUFJLE9BQU9DLEtBQVAsS0FBaUIsUUFBNUIsRUFBc0M7QUFDbEMscUJBQU8sVUFBUDtBQUNIOztBQUNELG1CQUFPQSxLQUFQO0FBQ0gsV0FMTSxDQUFQO0FBTUg7QUFDSixPQWhCTSxNQWdCQTtBQUNILGVBQU9SLEdBQVA7QUFDSDtBQUNKLEtBdEJNLENBQVAsQ0FMZ0IsQ0E2QmhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsUUFBSVMsSUFBSSxhQUFNYixFQUFOLGNBQVlKLEtBQVosY0FBcUJHLElBQUksQ0FBQ2UsSUFBTCxDQUFVLEdBQVYsQ0FBckIsT0FBUixDQWxDZ0IsQ0FtQ2hCOztBQUNBRCxJQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0UsT0FBTCxDQUFhLHVCQUFiLEVBQXNDLGFBQXRDLENBQVAsQ0FwQ2dCLENBcUNoQjtBQUNBOztBQUNBLFNBQUsvQixJQUFMLElBQWE2QixJQUFiO0FBQ0g7QUFFRDs7Ozs7OztBQUtBRyxFQUFBQSxLQUFLLENBQUNDLFFBQUQsRUFBVztBQUNaO0FBQ0E7QUFDQSxRQUFJQSxRQUFKLEVBQWM7QUFDVixhQUFPLEtBQUtqQyxJQUFaO0FBQ0g7O0FBQ0QsVUFBTWtDLFdBQVcsR0FBRyxLQUFLbEMsSUFBekI7QUFDQSxTQUFLQSxJQUFMLEdBQVksRUFBWjtBQUNBLFdBQU9rQyxXQUFQO0FBQ0g7O0FBL0VlLEMsQ0FrRnBCOzs7QUFDQSxNQUFNQyxpQkFBTixDQUF3QjtBQUNwQnBDLEVBQUFBLFdBQVcsQ0FBQ3FDLFNBQUQsRUFBWUMsTUFBWixFQUFvQjtBQUMzQixTQUFLRCxTQUFMLEdBQWlCQSxTQUFqQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtDLEVBQUwsR0FBVSxjQUFjQyxJQUFJLENBQUNDLE1BQUwsRUFBZCxHQUE4QnZCLElBQUksQ0FBQ3dCLEdBQUwsRUFBeEM7QUFDQSxTQUFLQyxLQUFMLEdBQWEsQ0FBYjtBQUNBLFNBQUtDLEVBQUwsR0FBVSxJQUFWLENBTDJCLENBTzNCOztBQUNBLFNBQUtDLFlBQUwsR0FBb0IsSUFBcEIsQ0FSMkIsQ0FTM0I7O0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsSUFBekI7QUFDSDtBQUVEOzs7OztBQUdBQyxFQUFBQSxPQUFPLEdBQUc7QUFDTixVQUFNQyxHQUFHLEdBQUcsS0FBS1gsU0FBTCxDQUFlWSxJQUFmLENBQW9CLE1BQXBCLENBQVo7QUFDQSxXQUFPLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDcENKLE1BQUFBLEdBQUcsQ0FBQ0ssU0FBSixHQUFpQkMsS0FBRCxJQUFXO0FBQ3ZCLGFBQUtWLEVBQUwsR0FBVVUsS0FBSyxDQUFDQyxNQUFOLENBQWFDLE1BQXZCLENBRHVCLENBRXZCOztBQUNBQyxRQUFBQSxXQUFXLENBQUMsS0FBS3hCLEtBQUwsQ0FBV2xCLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBRCxFQUF3QmxCLGFBQXhCLENBQVg7QUFDQXNELFFBQUFBLE9BQU87QUFDVixPQUxEOztBQU9BSCxNQUFBQSxHQUFHLENBQUNVLE9BQUosR0FBZUosS0FBRCxJQUFXO0FBQ3JCLGNBQU1LLEdBQUcsR0FDTCxrQ0FBa0NMLEtBQUssQ0FBQ0MsTUFBTixDQUFhL0MsS0FBYixDQUFtQm9ELElBRHpEO0FBR0FDLFFBQUFBLE9BQU8sQ0FBQ3JELEtBQVIsQ0FBY21ELEdBQWQ7QUFDQVAsUUFBQUEsTUFBTSxDQUFDLElBQUk5QixLQUFKLENBQVVxQyxHQUFWLENBQUQsQ0FBTjtBQUNILE9BTkQsQ0FSb0MsQ0FnQnBDOzs7QUFDQVgsTUFBQUEsR0FBRyxDQUFDYyxlQUFKLEdBQXVCUixLQUFELElBQVc7QUFDN0IsY0FBTVYsRUFBRSxHQUFHVSxLQUFLLENBQUNDLE1BQU4sQ0FBYUMsTUFBeEI7QUFDQSxjQUFNTyxXQUFXLEdBQUduQixFQUFFLENBQUNvQixpQkFBSCxDQUFxQixNQUFyQixFQUE2QjtBQUM3Q0MsVUFBQUEsT0FBTyxFQUFFLENBQUMsSUFBRCxFQUFPLE9BQVA7QUFEb0MsU0FBN0IsQ0FBcEIsQ0FGNkIsQ0FLN0I7QUFDQTtBQUNBOztBQUNBRixRQUFBQSxXQUFXLENBQUNHLFdBQVosQ0FBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0M7QUFBRUMsVUFBQUEsTUFBTSxFQUFFO0FBQVYsU0FBcEM7QUFFQUosUUFBQUEsV0FBVyxDQUFDSyxHQUFaLENBQ0ksS0FBS0MsaUJBQUwsQ0FDSSxJQUFJbkQsSUFBSixLQUFhLGdDQURqQixDQURKO0FBTUEsY0FBTW9ELGlCQUFpQixHQUFHMUIsRUFBRSxDQUFDb0IsaUJBQUgsQ0FBcUIsYUFBckIsRUFBb0M7QUFDMURDLFVBQUFBLE9BQU8sRUFBRTtBQURpRCxTQUFwQyxDQUExQjtBQUdBSyxRQUFBQSxpQkFBaUIsQ0FBQ0YsR0FBbEIsQ0FBc0IsS0FBS0cseUJBQUwsRUFBdEI7QUFDSCxPQXBCRDtBQXFCSCxLQXRDTSxDQUFQO0FBdUNIO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQXRDLEVBQUFBLEtBQUssR0FBRztBQUNKO0FBQ0EsUUFBSSxLQUFLWSxZQUFULEVBQXVCO0FBQ25CLFVBQUksS0FBS0MsaUJBQVQsRUFBNEI7QUFDeEI7QUFDQSxlQUFPLEtBQUtBLGlCQUFaO0FBQ0gsT0FKa0IsQ0FLbkI7OztBQUNBLFdBQUtBLGlCQUFMLEdBQXlCLEtBQUtELFlBQUwsQ0FBa0IyQixJQUFsQixDQUF1QixNQUFNO0FBQ2xELGVBQU8sS0FBS3ZDLEtBQUwsRUFBUDtBQUNILE9BRndCLEVBRXRCdUMsSUFGc0IsQ0FFakIsTUFBTTtBQUNWLGFBQUsxQixpQkFBTCxHQUF5QixJQUF6QjtBQUNILE9BSndCLENBQXpCO0FBS0EsYUFBTyxLQUFLQSxpQkFBWjtBQUNILEtBZEcsQ0FlSjtBQUNBOzs7QUFDQSxTQUFLRCxZQUFMLEdBQW9CLElBQUlLLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDakQsVUFBSSxDQUFDLEtBQUtSLEVBQVYsRUFBYztBQUNWO0FBQ0FRLFFBQUFBLE1BQU0sQ0FBQyxJQUFJOUIsS0FBSixDQUFVLHVCQUFWLENBQUQsQ0FBTjtBQUNBO0FBQ0g7O0FBQ0QsWUFBTW1ELEtBQUssR0FBRyxLQUFLbkMsTUFBTCxDQUFZTCxLQUFaLEVBQWQ7O0FBQ0EsVUFBSXdDLEtBQUssQ0FBQ0MsTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUNwQnZCLFFBQUFBLE9BQU87QUFDUDtBQUNIOztBQUNELFlBQU13QixHQUFHLEdBQUcsS0FBSy9CLEVBQUwsQ0FBUWdDLFdBQVIsQ0FBb0IsQ0FBQyxNQUFELEVBQVMsYUFBVCxDQUFwQixFQUE2QyxXQUE3QyxDQUFaO0FBQ0EsWUFBTUMsUUFBUSxHQUFHRixHQUFHLENBQUNHLFdBQUosQ0FBZ0IsTUFBaEIsQ0FBakI7O0FBQ0FILE1BQUFBLEdBQUcsQ0FBQ0ksVUFBSixHQUFrQnpCLEtBQUQsSUFBVztBQUN4QkgsUUFBQUEsT0FBTztBQUNWLE9BRkQ7O0FBR0F3QixNQUFBQSxHQUFHLENBQUNqQixPQUFKLEdBQWVKLEtBQUQsSUFBVztBQUNyQk8sUUFBQUEsT0FBTyxDQUFDckQsS0FBUixDQUNJLHlCQURKLEVBQytCOEMsS0FEL0I7QUFHQUYsUUFBQUEsTUFBTSxDQUNGLElBQUk5QixLQUFKLENBQVUsMkJBQTJCZ0MsS0FBSyxDQUFDQyxNQUFOLENBQWF5QixTQUFsRCxDQURFLENBQU47QUFHSCxPQVBEOztBQVFBSCxNQUFBQSxRQUFRLENBQUNULEdBQVQsQ0FBYSxLQUFLQyxpQkFBTCxDQUF1QkksS0FBdkIsQ0FBYjtBQUNBLFlBQU1RLFlBQVksR0FBR04sR0FBRyxDQUFDRyxXQUFKLENBQWdCLGFBQWhCLENBQXJCO0FBQ0FHLE1BQUFBLFlBQVksQ0FBQ0MsR0FBYixDQUFpQixLQUFLWCx5QkFBTCxFQUFqQjtBQUNILEtBM0JtQixFQTJCakJDLElBM0JpQixDQTJCWixNQUFNO0FBQ1YsV0FBSzNCLFlBQUwsR0FBb0IsSUFBcEI7QUFDSCxLQTdCbUIsQ0FBcEI7QUE4QkEsV0FBTyxLQUFLQSxZQUFaO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7O0FBVUEsUUFBTXNDLE9BQU4sR0FBZ0I7QUFDWixVQUFNdkMsRUFBRSxHQUFHLEtBQUtBLEVBQWhCLENBRFksQ0FHWjtBQUNBOztBQUNBLGFBQVN3QyxTQUFULENBQW1CN0MsRUFBbkIsRUFBdUI4QyxPQUF2QixFQUFnQztBQUM1QixZQUFNUCxXQUFXLEdBQUdsQyxFQUFFLENBQUNnQyxXQUFILENBQWUsTUFBZixFQUF1QixVQUF2QixFQUFtQ0UsV0FBbkMsQ0FBK0MsTUFBL0MsQ0FBcEI7QUFFQSxhQUFPLElBQUk1QixPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3BDLGNBQU1rQyxLQUFLLEdBQUdSLFdBQVcsQ0FBQ25DLEtBQVosQ0FBa0IsSUFBbEIsRUFBd0I0QyxVQUF4QixDQUFtQ0MsV0FBVyxDQUFDQyxJQUFaLENBQWlCbEQsRUFBakIsQ0FBbkMsRUFBeUQsTUFBekQsQ0FBZDtBQUNBLFlBQUlrQyxLQUFLLEdBQUcsRUFBWjs7QUFDQWEsUUFBQUEsS0FBSyxDQUFDNUIsT0FBTixHQUFpQkosS0FBRCxJQUFXO0FBQ3ZCRixVQUFBQSxNQUFNLENBQUMsSUFBSTlCLEtBQUosQ0FBVSxtQkFBbUJnQyxLQUFLLENBQUNDLE1BQU4sQ0FBYXlCLFNBQTFDLENBQUQsQ0FBTjtBQUNILFNBRkQ7O0FBR0FNLFFBQUFBLEtBQUssQ0FBQ2pDLFNBQU4sR0FBbUJDLEtBQUQsSUFBVztBQUN6QixnQkFBTW9DLE1BQU0sR0FBR3BDLEtBQUssQ0FBQ0MsTUFBTixDQUFhQyxNQUE1Qjs7QUFDQSxjQUFJLENBQUNrQyxNQUFMLEVBQWE7QUFDVHZDLFlBQUFBLE9BQU8sQ0FBQ3NCLEtBQUQsQ0FBUDtBQUNBLG1CQUZTLENBRUQ7QUFDWDs7QUFDREEsVUFBQUEsS0FBSyxHQUFHaUIsTUFBTSxDQUFDN0QsS0FBUCxDQUFhNEMsS0FBYixHQUFxQkEsS0FBN0I7O0FBQ0EsY0FBSUEsS0FBSyxDQUFDQyxNQUFOLElBQWdCVyxPQUFwQixFQUE2QjtBQUN6QmxDLFlBQUFBLE9BQU8sQ0FBQ3NCLEtBQUQsQ0FBUDtBQUNILFdBRkQsTUFFTztBQUNIaUIsWUFBQUEsTUFBTSxDQUFDQyxRQUFQO0FBQ0g7QUFDSixTQVpEO0FBYUgsT0FuQk0sQ0FBUDtBQW9CSCxLQTVCVyxDQThCWjs7O0FBQ0EsYUFBU0MsV0FBVCxHQUF1QjtBQUNuQjtBQUNBLFlBQU1DLENBQUMsR0FBR2pELEVBQUUsQ0FBQ2dDLFdBQUgsQ0FBZSxhQUFmLEVBQThCLFVBQTlCLEVBQTBDRSxXQUExQyxDQUNOLGFBRE0sQ0FBVjtBQUdBLGFBQU9nQixXQUFXLENBQUNELENBQUQsRUFBSUUsU0FBSixFQUFnQkwsTUFBRCxJQUFZO0FBQ3pDLGVBQU87QUFDSG5ELFVBQUFBLEVBQUUsRUFBRW1ELE1BQU0sQ0FBQzdELEtBQVAsQ0FBYVUsRUFEZDtBQUVIdEIsVUFBQUEsRUFBRSxFQUFFeUUsTUFBTSxDQUFDN0QsS0FBUCxDQUFhWjtBQUZkLFNBQVA7QUFJSCxPQUxpQixDQUFYLENBS0p1RCxJQUxJLENBS0V3QixHQUFELElBQVM7QUFDYjtBQUNBLGVBQU9BLEdBQUcsQ0FBQ0MsSUFBSixDQUFTLENBQUNDLENBQUQsRUFBSUMsQ0FBSixLQUFVO0FBQ3RCLGlCQUFPQSxDQUFDLENBQUNsRixFQUFGLEdBQU9pRixDQUFDLENBQUNqRixFQUFoQjtBQUNILFNBRk0sRUFFSkcsR0FGSSxDQUVDOEUsQ0FBRCxJQUFPQSxDQUFDLENBQUMzRCxFQUZULENBQVA7QUFHSCxPQVZNLENBQVA7QUFXSDs7QUFFRCxhQUFTNkQsVUFBVCxDQUFvQjdELEVBQXBCLEVBQXdCO0FBQ3BCLGFBQU8sSUFBSVcsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUNwQyxjQUFNdUIsR0FBRyxHQUFHL0IsRUFBRSxDQUFDZ0MsV0FBSCxDQUNSLENBQUMsTUFBRCxFQUFTLGFBQVQsQ0FEUSxFQUNpQixXQURqQixDQUFaO0FBR0EsY0FBTWlCLENBQUMsR0FBR2xCLEdBQUcsQ0FBQ0csV0FBSixDQUFnQixNQUFoQixDQUFWLENBSm9DLENBS3BDOztBQUNBLGNBQU1RLEtBQUssR0FBR08sQ0FBQyxDQUFDbEQsS0FBRixDQUFRLElBQVIsRUFBYzBELGFBQWQsQ0FBNEJiLFdBQVcsQ0FBQ0MsSUFBWixDQUFpQmxELEVBQWpCLENBQTVCLENBQWQ7O0FBQ0ErQyxRQUFBQSxLQUFLLENBQUNqQyxTQUFOLEdBQW1CQyxLQUFELElBQVc7QUFDekIsZ0JBQU1vQyxNQUFNLEdBQUdwQyxLQUFLLENBQUNDLE1BQU4sQ0FBYUMsTUFBNUI7O0FBQ0EsY0FBSSxDQUFDa0MsTUFBTCxFQUFhO0FBQ1Q7QUFDSDs7QUFDREcsVUFBQUEsQ0FBQyxDQUFDUyxNQUFGLENBQVNaLE1BQU0sQ0FBQ2EsVUFBaEI7QUFDQWIsVUFBQUEsTUFBTSxDQUFDQyxRQUFQO0FBQ0gsU0FQRDs7QUFRQWhCLFFBQUFBLEdBQUcsQ0FBQ0ksVUFBSixHQUFpQixNQUFNO0FBQ25CNUIsVUFBQUEsT0FBTztBQUNWLFNBRkQ7O0FBR0F3QixRQUFBQSxHQUFHLENBQUNqQixPQUFKLEdBQWVKLEtBQUQsSUFBVztBQUNyQkYsVUFBQUEsTUFBTSxDQUNGLElBQUk5QixLQUFKLENBQ0ksMENBQ0lpQixFQURKLGlCQUNhZSxLQUFLLENBQUNDLE1BQU4sQ0FBYXlCLFNBRDFCLENBREosQ0FERSxDQUFOO0FBTUgsU0FQRCxDQWxCb0MsQ0EwQnBDOzs7QUFDQSxjQUFNQyxZQUFZLEdBQUdOLEdBQUcsQ0FBQ0csV0FBSixDQUFnQixhQUFoQixDQUFyQjtBQUNBRyxRQUFBQSxZQUFZLENBQUNxQixNQUFiLENBQW9CL0QsRUFBcEI7QUFDSCxPQTdCTSxDQUFQO0FBOEJIOztBQUVELFVBQU1pRSxTQUFTLEdBQUcsTUFBTVosV0FBVyxFQUFuQztBQUNBLFFBQUlhLFlBQVksR0FBRyxFQUFuQjtBQUNBLFVBQU14RyxJQUFJLEdBQUcsRUFBYjtBQUNBLFFBQUl5RyxJQUFJLEdBQUcsQ0FBWDs7QUFDQSxTQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILFNBQVMsQ0FBQzlCLE1BQTlCLEVBQXNDaUMsQ0FBQyxFQUF2QyxFQUEyQztBQUN2QyxZQUFNbEMsS0FBSyxHQUFHLE1BQU1XLFNBQVMsQ0FBQ29CLFNBQVMsQ0FBQ0csQ0FBRCxDQUFWLEVBQWU3RyxZQUFZLEdBQUc0RyxJQUE5QixDQUE3QixDQUR1QyxDQUd2QztBQUNBOztBQUNBekcsTUFBQUEsSUFBSSxDQUFDMkcsSUFBTCxDQUFVO0FBQ05uQyxRQUFBQSxLQUFLLEVBQUVBLEtBREQ7QUFFTmxDLFFBQUFBLEVBQUUsRUFBRWlFLFNBQVMsQ0FBQ0csQ0FBRDtBQUZQLE9BQVY7QUFJQUQsTUFBQUEsSUFBSSxJQUFJakMsS0FBSyxDQUFDQyxNQUFkLENBVHVDLENBV3ZDO0FBQ0E7O0FBQ0EsVUFBSWdDLElBQUksSUFBSTVHLFlBQVosRUFBMEI7QUFDdEI7QUFDQTtBQUNBMkcsUUFBQUEsWUFBWSxHQUFHRCxTQUFTLENBQUNLLEtBQVYsQ0FBZ0JGLENBQUMsR0FBRyxDQUFwQixDQUFmO0FBQ0E7QUFDSDtBQUVKOztBQUNELFFBQUlGLFlBQVksQ0FBQy9CLE1BQWIsR0FBc0IsQ0FBMUIsRUFBNkI7QUFDekJiLE1BQUFBLE9BQU8sQ0FBQ3hELEdBQVIsQ0FBWSxpQkFBWixFQUErQm9HLFlBQS9CLEVBRHlCLENBRXpCO0FBQ0E7O0FBQ0F2RCxNQUFBQSxPQUFPLENBQUM0RCxHQUFSLENBQVlMLFlBQVksQ0FBQ3JGLEdBQWIsQ0FBa0JtQixFQUFELElBQVE2RCxVQUFVLENBQUM3RCxFQUFELENBQW5DLENBQVosRUFBc0RpQyxJQUF0RCxDQUEyRCxNQUFNO0FBQzdEWCxRQUFBQSxPQUFPLENBQUN4RCxHQUFSLG1CQUF1Qm9HLFlBQVksQ0FBQy9CLE1BQXBDO0FBQ0gsT0FGRCxFQUVJZixHQUFELElBQVM7QUFDUkUsUUFBQUEsT0FBTyxDQUFDckQsS0FBUixDQUFjbUQsR0FBZDtBQUNILE9BSkQ7QUFLSDs7QUFDRCxXQUFPMUQsSUFBUDtBQUNIOztBQUVEb0UsRUFBQUEsaUJBQWlCLENBQUNJLEtBQUQsRUFBUTtBQUNyQixXQUFPO0FBQ0hsQyxNQUFBQSxFQUFFLEVBQUUsS0FBS0EsRUFETjtBQUVIa0MsTUFBQUEsS0FBSyxFQUFFQSxLQUZKO0FBR0g5QixNQUFBQSxLQUFLLEVBQUUsS0FBS0EsS0FBTDtBQUhKLEtBQVA7QUFLSDs7QUFFRDRCLEVBQUFBLHlCQUF5QixHQUFHO0FBQ3hCLFdBQU87QUFDSGhDLE1BQUFBLEVBQUUsRUFBRSxLQUFLQSxFQUROO0FBRUh0QixNQUFBQSxFQUFFLEVBQUVDLElBQUksQ0FBQ3dCLEdBQUw7QUFGRCxLQUFQO0FBSUg7O0FBaFJtQjtBQW1SeEI7Ozs7Ozs7Ozs7OztBQVVBLFNBQVNvRCxXQUFULENBQXFCaUIsS0FBckIsRUFBNEJDLFFBQTVCLEVBQXNDQyxZQUF0QyxFQUFvRDtBQUNoRCxRQUFNM0IsS0FBSyxHQUFHeUIsS0FBSyxDQUFDeEIsVUFBTixDQUFpQnlCLFFBQWpCLENBQWQ7QUFDQSxTQUFPLElBQUk5RCxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3BDLFVBQU04RCxPQUFPLEdBQUcsRUFBaEI7O0FBQ0E1QixJQUFBQSxLQUFLLENBQUM1QixPQUFOLEdBQWlCSixLQUFELElBQVc7QUFDdkJGLE1BQUFBLE1BQU0sQ0FBQyxJQUFJOUIsS0FBSixDQUFVLG1CQUFtQmdDLEtBQUssQ0FBQ0MsTUFBTixDQUFheUIsU0FBMUMsQ0FBRCxDQUFOO0FBQ0gsS0FGRCxDQUZvQyxDQUtwQzs7O0FBQ0FNLElBQUFBLEtBQUssQ0FBQ2pDLFNBQU4sR0FBbUJDLEtBQUQsSUFBVztBQUN6QixZQUFNb0MsTUFBTSxHQUFHcEMsS0FBSyxDQUFDQyxNQUFOLENBQWFDLE1BQTVCOztBQUNBLFVBQUksQ0FBQ2tDLE1BQUwsRUFBYTtBQUNUdkMsUUFBQUEsT0FBTyxDQUFDK0QsT0FBRCxDQUFQO0FBQ0EsZUFGUyxDQUVEO0FBQ1g7O0FBQ0RBLE1BQUFBLE9BQU8sQ0FBQ04sSUFBUixDQUFhSyxZQUFZLENBQUN2QixNQUFELENBQXpCO0FBQ0FBLE1BQUFBLE1BQU0sQ0FBQ0MsUUFBUDtBQUNILEtBUkQ7QUFTSCxHQWZNLENBQVA7QUFnQkg7QUFFRDs7Ozs7OztBQUtPLFNBQVN3QixJQUFULEdBQWdCO0FBQ25CLE1BQUlDLE1BQU0sQ0FBQ0MsbUJBQVgsRUFBZ0M7QUFDNUIsV0FBT0QsTUFBTSxDQUFDQyxtQkFBZDtBQUNIOztBQUNERCxFQUFBQSxNQUFNLENBQUNFLGNBQVAsR0FBd0IsSUFBSXZILGFBQUosRUFBeEI7QUFDQXFILEVBQUFBLE1BQU0sQ0FBQ0UsY0FBUCxDQUFzQnBILFdBQXRCLENBQWtDcUgsTUFBTSxDQUFDMUQsT0FBekMsRUFMbUIsQ0FPbkI7QUFDQTs7QUFDQSxNQUFJeEIsU0FBSjs7QUFDQSxNQUFJO0FBQ0FBLElBQUFBLFNBQVMsR0FBR2tGLE1BQU0sQ0FBQ2xGLFNBQW5CO0FBQ0gsR0FGRCxDQUVFLE9BQU9WLENBQVAsRUFBVSxDQUFFOztBQUVkLE1BQUlVLFNBQUosRUFBZTtBQUNYK0UsSUFBQUEsTUFBTSxDQUFDSSxhQUFQLEdBQXVCLElBQUlwRixpQkFBSixDQUFzQkMsU0FBdEIsRUFBaUMrRSxNQUFNLENBQUNFLGNBQXhDLENBQXZCO0FBQ0FGLElBQUFBLE1BQU0sQ0FBQ0MsbUJBQVAsR0FBNkJELE1BQU0sQ0FBQ0ksYUFBUCxDQUFxQnpFLE9BQXJCLEVBQTdCO0FBQ0EsV0FBT3FFLE1BQU0sQ0FBQ0MsbUJBQWQ7QUFDSDs7QUFDREQsRUFBQUEsTUFBTSxDQUFDQyxtQkFBUCxHQUE2Qm5FLE9BQU8sQ0FBQ0MsT0FBUixFQUE3QjtBQUNBLFNBQU9pRSxNQUFNLENBQUNDLG1CQUFkO0FBQ0g7O0FBRU0sU0FBU3BGLEtBQVQsR0FBaUI7QUFDcEIsTUFBSSxDQUFDbUYsTUFBTSxDQUFDSSxhQUFaLEVBQTJCO0FBQ3ZCO0FBQ0g7O0FBQ0RKLEVBQUFBLE1BQU0sQ0FBQ0ksYUFBUCxDQUFxQnZGLEtBQXJCO0FBQ0g7QUFFRDs7Ozs7O0FBSU8sZUFBZXdGLE9BQWYsR0FBeUI7QUFDNUIsTUFBSSxDQUFDTCxNQUFNLENBQUNJLGFBQVosRUFBMkI7QUFDdkI7QUFDSDs7QUFDRCxRQUFNSixNQUFNLENBQUNJLGFBQVAsQ0FBcUJyQyxPQUFyQixFQUFOO0FBQ0g7QUFFRDs7Ozs7OztBQUtPLGVBQWV1QyxnQkFBZixHQUFrQztBQUNyQyxNQUFJLENBQUNOLE1BQU0sQ0FBQ0UsY0FBWixFQUE0QjtBQUN4QixVQUFNLElBQUloRyxLQUFKLENBQ0YsbURBREUsQ0FBTjtBQUdILEdBTG9DLENBTXJDO0FBQ0E7OztBQUNBLE1BQUk4RixNQUFNLENBQUNJLGFBQVgsRUFBMEI7QUFDdEI7QUFDQSxVQUFNSixNQUFNLENBQUNJLGFBQVAsQ0FBcUJ2RixLQUFyQixFQUFOO0FBQ0EsV0FBTyxNQUFNbUYsTUFBTSxDQUFDSSxhQUFQLENBQXFCckMsT0FBckIsRUFBYjtBQUNILEdBSkQsTUFJTztBQUNILFdBQU8sQ0FBQztBQUNKVixNQUFBQSxLQUFLLEVBQUUyQyxNQUFNLENBQUNFLGNBQVAsQ0FBc0JyRixLQUF0QixDQUE0QixJQUE1QixDQURIO0FBRUpNLE1BQUFBLEVBQUUsRUFBRTtBQUZBLEtBQUQsQ0FBUDtBQUlIO0FBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIFRoaXMgbW9kdWxlIGNvbnRhaW5zIGFsbCB0aGUgY29kZSBuZWVkZWQgdG8gbG9nIHRoZSBjb25zb2xlLCBwZXJzaXN0IGl0IHRvXG4vLyBkaXNrIGFuZCBzdWJtaXQgYnVnIHJlcG9ydHMuIFJhdGlvbmFsZSBpcyBhcyBmb2xsb3dzOlxuLy8gIC0gTW9ua2V5LXBhdGNoaW5nIHRoZSBjb25zb2xlIGlzIHByZWZlcmFibGUgdG8gaGF2aW5nIGEgbG9nIGxpYnJhcnkgYmVjYXVzZVxuLy8gICAgd2UgY2FuIGNhdGNoIGxvZ3MgYnkgb3RoZXIgbGlicmFyaWVzIG1vcmUgZWFzaWx5LCB3aXRob3V0IGhhdmluZyB0byBhbGxcbi8vICAgIGRlcGVuZCBvbiB0aGUgc2FtZSBsb2cgZnJhbWV3b3JrIC8gcGFzcyB0aGUgbG9nZ2VyIGFyb3VuZC5cbi8vICAtIFdlIHVzZSBJbmRleGVkREIgdG8gcGVyc2lzdHMgbG9ncyBiZWNhdXNlIGl0IGhhcyBnZW5lcm91cyBkaXNrIHNwYWNlXG4vLyAgICBsaW1pdHMgY29tcGFyZWQgdG8gbG9jYWwgc3RvcmFnZS4gSW5kZXhlZERCIGRvZXMgbm90IHdvcmsgaW4gaW5jb2duaXRvXG4vLyAgICBtb2RlLCBpbiB3aGljaCBjYXNlIHRoaXMgbW9kdWxlIHdpbGwgbm90IGJlIGFibGUgdG8gd3JpdGUgbG9ncyB0byBkaXNrLlxuLy8gICAgSG93ZXZlciwgdGhlIGxvZ3Mgd2lsbCBzdGlsbCBiZSBzdG9yZWQgaW4tbWVtb3J5LCBzbyBjYW4gc3RpbGwgYmVcbi8vICAgIHN1Ym1pdHRlZCBpbiBhIGJ1ZyByZXBvcnQgc2hvdWxkIHRoZSB1c2VyIHdpc2ggdG86IHdlIGNhbiBhbHNvIHN0b3JlIG1vcmVcbi8vICAgIGxvZ3MgaW4tbWVtb3J5IHRoYW4gaW4gbG9jYWwgc3RvcmFnZSwgd2hpY2ggZG9lcyB3b3JrIGluIGluY29nbml0byBtb2RlLlxuLy8gICAgV2UgYWxzbyBuZWVkIHRvIGhhbmRsZSB0aGUgY2FzZSB3aGVyZSB0aGVyZSBhcmUgMisgdGFicy4gRWFjaCBKUyBydW50aW1lXG4vLyAgICBnZW5lcmF0ZXMgYSByYW5kb20gc3RyaW5nIHdoaWNoIHNlcnZlcyBhcyB0aGUgXCJJRFwiIGZvciB0aGF0IHRhYi9zZXNzaW9uLlxuLy8gICAgVGhlc2UgSURzIGFyZSBzdG9yZWQgYWxvbmcgd2l0aCB0aGUgbG9nIGxpbmVzLlxuLy8gIC0gQnVnIHJlcG9ydHMgYXJlIHNlbnQgYXMgYSBQT1NUIG92ZXIgSFRUUFM6IGl0IHB1cnBvc2VmdWxseSBkb2VzIG5vdCB1c2Vcbi8vICAgIE1hdHJpeCBhcyBidWcgcmVwb3J0cyBtYXkgYmUgbWFkZSB3aGVuIE1hdHJpeCBpcyBub3QgcmVzcG9uc2l2ZSAod2hpY2ggbWF5XG4vLyAgICBiZSB0aGUgY2F1c2Ugb2YgdGhlIGJ1ZykuIFdlIHNlbmQgdGhlIG1vc3QgcmVjZW50IE4gTUIgb2YgVVRGLTggbG9nIGRhdGEsXG4vLyAgICBzdGFydGluZyB3aXRoIHRoZSBtb3N0IHJlY2VudCwgd2hpY2ggd2Uga25vdyBiZWNhdXNlIHRoZSBcIklEXCJzIGFyZVxuLy8gICAgYWN0dWFsbHkgdGltZXN0YW1wcy4gV2UgdGhlbiBwdXJnZSB0aGUgcmVtYWluaW5nIGxvZ3MuIFdlIGFsc28gZG8gdGhpc1xuLy8gICAgcHVyZ2Ugb24gc3RhcnR1cCB0byBwcmV2ZW50IGxvZ3MgZnJvbSBhY2N1bXVsYXRpbmcuXG5cbi8vIHRoZSBmcmVxdWVuY3kgd2l0aCB3aGljaCB3ZSBmbHVzaCB0byBpbmRleGVkZGJcbmNvbnN0IEZMVVNIX1JBVEVfTVMgPSAzMCAqIDEwMDA7XG5cbi8vIHRoZSBsZW5ndGggb2YgbG9nIGRhdGEgd2Uga2VlcCBpbiBpbmRleGVkZGIgKGFuZCBpbmNsdWRlIGluIHRoZSByZXBvcnRzKVxuY29uc3QgTUFYX0xPR19TSVpFID0gMTAyNCAqIDEwMjQgKiA1OyAvLyA1IE1CXG5cbi8vIEEgY2xhc3Mgd2hpY2ggbW9ua2V5LXBhdGNoZXMgdGhlIGdsb2JhbCBjb25zb2xlIGFuZCBzdG9yZXMgbG9nIGxpbmVzLlxuY2xhc3MgQ29uc29sZUxvZ2dlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubG9ncyA9IFwiXCI7XG4gICAgfVxuXG4gICAgbW9ua2V5UGF0Y2goY29uc29sZU9iaikge1xuICAgICAgICAvLyBNb25rZXktcGF0Y2ggY29uc29sZSBsb2dnaW5nXG4gICAgICAgIGNvbnN0IGNvbnNvbGVGdW5jdGlvbnNUb0xldmVscyA9IHtcbiAgICAgICAgICAgIGxvZzogXCJJXCIsXG4gICAgICAgICAgICBpbmZvOiBcIklcIixcbiAgICAgICAgICAgIHdhcm46IFwiV1wiLFxuICAgICAgICAgICAgZXJyb3I6IFwiRVwiLFxuICAgICAgICB9O1xuICAgICAgICBPYmplY3Qua2V5cyhjb25zb2xlRnVuY3Rpb25zVG9MZXZlbHMpLmZvckVhY2goKGZuTmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGV2ZWwgPSBjb25zb2xlRnVuY3Rpb25zVG9MZXZlbHNbZm5OYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsRm4gPSBjb25zb2xlT2JqW2ZuTmFtZV0uYmluZChjb25zb2xlT2JqKTtcbiAgICAgICAgICAgIGNvbnNvbGVPYmpbZm5OYW1lXSA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cobGV2ZWwsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsRm4oLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBsb2cobGV2ZWwsIC4uLmFyZ3MpIHtcbiAgICAgICAgLy8gV2UgZG9uJ3Qga25vdyB3aGF0IGxvY2FsZSB0aGUgdXNlciBtYXkgYmUgcnVubmluZyBzbyB1c2UgSVNPIHN0cmluZ3NcbiAgICAgICAgY29uc3QgdHMgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgLy8gQ29udmVydCBvYmplY3RzIGFuZCBlcnJvcnMgdG8gaGVscGZ1bCB0aGluZ3NcbiAgICAgICAgYXJncyA9IGFyZ3MubWFwKChhcmcpID0+IHtcbiAgICAgICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmcubWVzc2FnZSArIChhcmcuc3RhY2sgPyBgXFxuJHthcmcuc3RhY2t9YCA6ICcnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChhcmcpID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gZGV2ZWxvcG1lbnQsIGl0IGNhbiBiZSB1c2VmdWwgdG8gbG9nIGNvbXBsZXggY3ljbGljXG4gICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgdG8gdGhlIGNvbnNvbGUgZm9yIGluc3BlY3Rpb24uIFRoaXMgaXMgZmluZSBmb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGNvbnNvbGUsIGJ1dCBkZWZhdWx0IGBzdHJpbmdpZnlgIGNhbid0IGhhbmRsZSB0aGF0LlxuICAgICAgICAgICAgICAgICAgICAvLyBXZSB3b3JrYXJvdW5kIHRoaXMgYnkgdXNpbmcgYSBzcGVjaWFsIHJlcGxhY2VyIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIG9ubHkgbG9nIHZhbHVlcyBvZiB0aGUgcm9vdCBvYmplY3QgYW5kIGF2b2lkIGN5Y2xlcy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiPG9iamVjdD5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHN1cHBvcnQgc3RyaW5nIGZvcm1hdHRpbmcgd2hpY2ggd2UncmUgbm90IGRvaW5nIGhlcmVcbiAgICAgICAgLy8gc28gdGhlIGxpbmVzIGFyZSBhIGxpdHRsZSBtb3JlIHVnbHkgYnV0IGVhc3kgdG8gaW1wbGVtZW50IC8gcXVpY2sgdG9cbiAgICAgICAgLy8gcnVuLlxuICAgICAgICAvLyBFeGFtcGxlIGxpbmU6XG4gICAgICAgIC8vIDIwMTctMDEtMThUMTE6MjM6NTMuMjE0WiBXIEZhaWxlZCB0byBzZXQgYmFkZ2UgY291bnRcbiAgICAgICAgbGV0IGxpbmUgPSBgJHt0c30gJHtsZXZlbH0gJHthcmdzLmpvaW4oJyAnKX1cXG5gO1xuICAgICAgICAvLyBEbyBzb21lIGNsZWFudXBcbiAgICAgICAgbGluZSA9IGxpbmUucmVwbGFjZSgvdG9rZW49W2EtekEtWjAtOS1dKy9nbSwgJ3Rva2VuPXh4eHh4Jyk7XG4gICAgICAgIC8vIFVzaW5nICsgcmVhbGx5IGlzIHRoZSBxdWlja2VzdCB3YXkgaW4gSlNcbiAgICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vY29uY2F0LXZzLXBsdXMtdnMtam9pblxuICAgICAgICB0aGlzLmxvZ3MgKz0gbGluZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSBsb2cgbGluZXMgdG8gZmx1c2ggdG8gZGlzay5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGtlZXBMb2dzIFRydWUgdG8gbm90IGRlbGV0ZSBsb2dzIGFmdGVyIGZsdXNoaW5nLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gXFxuIGRlbGltaXRlZCBsb2cgbGluZXMgdG8gZmx1c2guXG4gICAgICovXG4gICAgZmx1c2goa2VlcExvZ3MpIHtcbiAgICAgICAgLy8gVGhlIENvbnNvbGVMb2dnZXIgZG9lc24ndCBjYXJlIGhvdyB0aGVzZSBlbmQgdXAgb24gZGlzaywgaXQganVzdFxuICAgICAgICAvLyBmbHVzaGVzIHRoZW0gdG8gdGhlIGNhbGxlci5cbiAgICAgICAgaWYgKGtlZXBMb2dzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2dzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvZ3NUb0ZsdXNoID0gdGhpcy5sb2dzO1xuICAgICAgICB0aGlzLmxvZ3MgPSBcIlwiO1xuICAgICAgICByZXR1cm4gbG9nc1RvRmx1c2g7XG4gICAgfVxufVxuXG4vLyBBIGNsYXNzIHdoaWNoIHN0b3JlcyBsb2cgbGluZXMgaW4gYW4gSW5kZXhlZERCIGluc3RhbmNlLlxuY2xhc3MgSW5kZXhlZERCTG9nU3RvcmUge1xuICAgIGNvbnN0cnVjdG9yKGluZGV4ZWREQiwgbG9nZ2VyKSB7XG4gICAgICAgIHRoaXMuaW5kZXhlZERCID0gaW5kZXhlZERCO1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgICAgICAgdGhpcy5pZCA9IFwiaW5zdGFuY2UtXCIgKyBNYXRoLnJhbmRvbSgpICsgRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy5pbmRleCA9IDA7XG4gICAgICAgIHRoaXMuZGIgPSBudWxsO1xuXG4gICAgICAgIC8vIHRoZXNlIHByb21pc2VzIGFyZSBjbGVhcmVkIGFzIHNvb24gYXMgZnVsZmlsbGVkXG4gICAgICAgIHRoaXMuZmx1c2hQcm9taXNlID0gbnVsbDtcbiAgICAgICAgLy8gc2V0IGlmIGZsdXNoKCkgaXMgY2FsbGVkIHdoaWxzdCBvbmUgaXMgb25nb2luZ1xuICAgICAgICB0aGlzLmZsdXNoQWdhaW5Qcm9taXNlID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBzdG9yZSBpcyByZWFkeS5cbiAgICAgKi9cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLmluZGV4ZWREQi5vcGVuKFwibG9nc1wiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAvLyBQZXJpb2RpY2FsbHkgZmx1c2ggbG9ncyB0byBsb2NhbCBzdG9yYWdlIC8gaW5kZXhlZGRiXG4gICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwodGhpcy5mbHVzaC5iaW5kKHRoaXMpLCBGTFVTSF9SQVRFX01TKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXEub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IChcbiAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gb3BlbiBsb2cgZGF0YWJhc2U6IFwiICsgZXZlbnQudGFyZ2V0LmVycm9yLm5hbWVcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gRmlyc3QgdGltZTogU2V0dXAgdGhlIG9iamVjdCBzdG9yZVxuICAgICAgICAgICAgcmVxLm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBsb2dPYmpTdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKFwibG9nc1wiLCB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGg6IFtcImlkXCIsIFwiaW5kZXhcIl0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gS2V5cyBpbiB0aGUgZGF0YWJhc2UgbG9vayBsaWtlOiBbIFwiaW5zdGFuY2UtMTQ4OTM4NDkwXCIsIDAgXVxuICAgICAgICAgICAgICAgIC8vIExhdGVyIG9uIHdlIG5lZWQgdG8gcXVlcnkgZXZlcnl0aGluZyBiYXNlZCBvbiBhbiBpbnN0YW5jZSBpZC5cbiAgICAgICAgICAgICAgICAvLyBJbiBvcmRlciB0byBkbyB0aGlzLCB3ZSBuZWVkIHRvIHNldCB1cCBpbmRleGVzIFwiaWRcIi5cbiAgICAgICAgICAgICAgICBsb2dPYmpTdG9yZS5jcmVhdGVJbmRleChcImlkXCIsIFwiaWRcIiwgeyB1bmlxdWU6IGZhbHNlIH0pO1xuXG4gICAgICAgICAgICAgICAgbG9nT2JqU3RvcmUuYWRkKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZUxvZ0VudHJ5KFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKSArIFwiIDo6OiBMb2cgZGF0YWJhc2Ugd2FzIGNyZWF0ZWQuXCIsXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RNb2RpZmllZFN0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoXCJsb2dzbGFzdG1vZFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGg6IFwiaWRcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsYXN0TW9kaWZpZWRTdG9yZS5hZGQodGhpcy5fZ2VuZXJhdGVMYXN0TW9kaWZpZWRUaW1lKCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmx1c2ggbG9ncyB0byBkaXNrLlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIGd1YXJkcyB0byBwcm90ZWN0IGFnYWluc3QgcmFjZSBjb25kaXRpb25zIGluIG9yZGVyIHRvIGVuc3VyZVxuICAgICAqIHRoYXQgYWxsIHByZXZpb3VzIGZsdXNoZXMgaGF2ZSBjb21wbGV0ZWQgYmVmb3JlIHRoZSBtb3N0IHJlY2VudCBmbHVzaC5cbiAgICAgKiBDb25zaWRlciB3aXRob3V0IGd1YXJkczpcbiAgICAgKiAgLSBBIGNhbGxzIGZsdXNoKCkgcGVyaW9kaWNhbGx5LlxuICAgICAqICAtIEIgY2FsbHMgZmx1c2goKSBhbmQgd2FudHMgdG8gc2VuZCBsb2dzIGltbWVkaWF0ZWx5IGFmdGVyd2FyZHMuXG4gICAgICogIC0gSWYgQiBkb2Vzbid0IHdhaXQgZm9yIEEncyBmbHVzaCB0byBjb21wbGV0ZSwgQiB3aWxsIGJlIG1pc3NpbmcgdGhlXG4gICAgICogICAgY29udGVudHMgb2YgQSdzIGZsdXNoLlxuICAgICAqIFRvIHByb3RlY3QgYWdhaW5zdCB0aGlzLCB3ZSBzZXQgJ2ZsdXNoUHJvbWlzZScgd2hlbiBhIGZsdXNoIGlzIG9uZ29pbmcuXG4gICAgICogU3Vic2VxdWVudCBjYWxscyB0byBmbHVzaCgpIGR1cmluZyB0aGlzIHBlcmlvZCB3aWxsIGNoYWluIGFub3RoZXIgZmx1c2gsXG4gICAgICogdGhlbiBrZWVwIHJldHVybmluZyB0aGF0IHNhbWUgY2hhaW5lZCBmbHVzaC5cbiAgICAgKlxuICAgICAqIFRoaXMgZ3VhcmFudGVlcyB0aGF0IHdlIHdpbGwgYWx3YXlzIGV2ZW50dWFsbHkgZG8gYSBmbHVzaCB3aGVuIGZsdXNoKCkgaXNcbiAgICAgKiBjYWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBSZXNvbHZlZCB3aGVuIHRoZSBsb2dzIGhhdmUgYmVlbiBmbHVzaGVkLlxuICAgICAqL1xuICAgIGZsdXNoKCkge1xuICAgICAgICAvLyBjaGVjayBpZiBhIGZsdXNoKCkgb3BlcmF0aW9uIGlzIG9uZ29pbmdcbiAgICAgICAgaWYgKHRoaXMuZmx1c2hQcm9taXNlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mbHVzaEFnYWluUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIDNyZCsgdGltZSB3ZSd2ZSBjYWxsZWQgZmx1c2goKSA6IHJldHVybiB0aGUgc2FtZSBwcm9taXNlLlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZsdXNoQWdhaW5Qcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcXVldWUgdXAgYSBmbHVzaCB0byBvY2N1ciBpbW1lZGlhdGVseSBhZnRlciB0aGUgcGVuZGluZyBvbmUgY29tcGxldGVzLlxuICAgICAgICAgICAgdGhpcy5mbHVzaEFnYWluUHJvbWlzZSA9IHRoaXMuZmx1c2hQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmZsdXNoQWdhaW5Qcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmx1c2hBZ2FpblByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gZmx1c2ggcHJvbWlzZSBvciB0aGVyZSB3YXMgYnV0IGl0IGhhcyBmaW5pc2hlZCwgc28gZG9cbiAgICAgICAgLy8gYSBicmFuZCBuZXcgb25lLCBkZXN0cm95aW5nIHRoZSBjaGFpbiB3aGljaCBtYXkgaGF2ZSBiZWVuIGJ1aWx0IHVwLlxuICAgICAgICB0aGlzLmZsdXNoUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kYikge1xuICAgICAgICAgICAgICAgIC8vIG5vdCBjb25uZWN0ZWQgeWV0IG9yIHVzZXIgcmVqZWN0ZWQgYWNjZXNzIGZvciB1cyB0byByL3cgdG8gdGhlIGRiLlxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJObyBjb25uZWN0ZWQgZGF0YWJhc2VcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gdGhpcy5sb2dnZXIuZmx1c2goKTtcbiAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdHhuID0gdGhpcy5kYi50cmFuc2FjdGlvbihbXCJsb2dzXCIsIFwibG9nc2xhc3Rtb2RcIl0sIFwicmVhZHdyaXRlXCIpO1xuICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoXCJsb2dzXCIpO1xuICAgICAgICAgICAgdHhuLm9uY29tcGxldGUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdHhuLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBmbHVzaCBsb2dzIDogXCIsIGV2ZW50LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KFxuICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gd3JpdGUgbG9nczogXCIgKyBldmVudC50YXJnZXQuZXJyb3JDb2RlKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9ialN0b3JlLmFkZCh0aGlzLl9nZW5lcmF0ZUxvZ0VudHJ5KGxpbmVzKSk7XG4gICAgICAgICAgICBjb25zdCBsYXN0TW9kU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoXCJsb2dzbGFzdG1vZFwiKTtcbiAgICAgICAgICAgIGxhc3RNb2RTdG9yZS5wdXQodGhpcy5fZ2VuZXJhdGVMYXN0TW9kaWZpZWRUaW1lKCkpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZmx1c2hQcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmZsdXNoUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25zdW1lIHRoZSBtb3N0IHJlY2VudCBsb2dzIGFuZCByZXR1cm4gdGhlbS4gT2xkZXIgbG9ncyB3aGljaCBhcmUgbm90XG4gICAgICogcmV0dXJuZWQgYXJlIGRlbGV0ZWQgYXQgdGhlIHNhbWUgdGltZSwgc28gdGhpcyBjYW4gYmUgY2FsbGVkIGF0IHN0YXJ0dXBcbiAgICAgKiB0byBkbyBob3VzZS1rZWVwaW5nIHRvIGtlZXAgdGhlIGxvZ3MgZnJvbSBncm93aW5nIHRvbyBsYXJnZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8T2JqZWN0W10+fSBSZXNvbHZlcyB0byBhbiBhcnJheSBvZiBvYmplY3RzLiBUaGUgYXJyYXkgaXNcbiAgICAgKiBzb3J0ZWQgaW4gdGltZSAob2xkZXN0IGZpcnN0KSBiYXNlZCBvbiB3aGVuIHRoZSBsb2cgZmlsZSB3YXMgY3JlYXRlZCAodGhlXG4gICAgICogbG9nIElEKS4gVGhlIG9iamVjdHMgaGF2ZSBzYWlkIGxvZyBJRCBpbiBhbiBcImlkXCIgZmllbGQgYW5kIFwibGluZXNcIiB3aGljaFxuICAgICAqIGlzIGEgYmlnIHN0cmluZyB3aXRoIGFsbCB0aGUgbmV3LWxpbmUgZGVsaW1pdGVkIGxvZ3MuXG4gICAgICovXG4gICAgYXN5bmMgY29uc3VtZSgpIHtcbiAgICAgICAgY29uc3QgZGIgPSB0aGlzLmRiO1xuXG4gICAgICAgIC8vIFJldHVybnM6IGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY29uY2F0ZW5hdGVkIGxvZ3MgZm9yIHRoaXMgSUQuXG4gICAgICAgIC8vIFN0b3BzIGFkZGluZyBsb2cgZnJhZ21lbnRzIHdoZW4gdGhlIHNpemUgZXhjZWVkcyBtYXhTaXplXG4gICAgICAgIGZ1bmN0aW9uIGZldGNoTG9ncyhpZCwgbWF4U2l6ZSkge1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSBkYi50cmFuc2FjdGlvbihcImxvZ3NcIiwgXCJyZWFkb25seVwiKS5vYmplY3RTdG9yZShcImxvZ3NcIik7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBvYmplY3RTdG9yZS5pbmRleChcImlkXCIpLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2Uub25seShpZCksICdwcmV2Jyk7XG4gICAgICAgICAgICAgICAgbGV0IGxpbmVzID0gJyc7XG4gICAgICAgICAgICAgICAgcXVlcnkub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUXVlcnkgZmFpbGVkOiBcIiArIGV2ZW50LnRhcmdldC5lcnJvckNvZGUpKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHF1ZXJ5Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsaW5lcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIGVuZCBvZiByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjdXJzb3IudmFsdWUubGluZXMgKyBsaW5lcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+PSBtYXhTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGxpbmVzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuczogQSBzb3J0ZWQgYXJyYXkgb2YgbG9nIElEcy4gKG5ld2VzdCBmaXJzdClcbiAgICAgICAgZnVuY3Rpb24gZmV0Y2hMb2dJZHMoKSB7XG4gICAgICAgICAgICAvLyBUbyBnYXRoZXIgYWxsIHRoZSBsb2cgSURzLCBxdWVyeSBmb3IgYWxsIHJlY29yZHMgaW4gbG9nc2xhc3Rtb2QuXG4gICAgICAgICAgICBjb25zdCBvID0gZGIudHJhbnNhY3Rpb24oXCJsb2dzbGFzdG1vZFwiLCBcInJlYWRvbmx5XCIpLm9iamVjdFN0b3JlKFxuICAgICAgICAgICAgICAgIFwibG9nc2xhc3Rtb2RcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0UXVlcnkobywgdW5kZWZpbmVkLCAoY3Vyc29yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGN1cnNvci52YWx1ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdHM6IGN1cnNvci52YWx1ZS50cyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gU29ydCBJRHMgYnkgdGltZXN0YW1wIChuZXdlc3QgZmlyc3QpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiLnRzIC0gYS50cztcbiAgICAgICAgICAgICAgICB9KS5tYXAoKGEpID0+IGEuaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZWxldGVMb2dzKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR4biA9IGRiLnRyYW5zYWN0aW9uKFxuICAgICAgICAgICAgICAgICAgICBbXCJsb2dzXCIsIFwibG9nc2xhc3Rtb2RcIl0sIFwicmVhZHdyaXRlXCIsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvID0gdHhuLm9iamVjdFN0b3JlKFwibG9nc1wiKTtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGxvYWQgdGhlIGtleSBwYXRoLCBub3QgdGhlIGRhdGEgd2hpY2ggbWF5IGJlIGh1Z2VcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeSA9IG8uaW5kZXgoXCJpZFwiKS5vcGVuS2V5Q3Vyc29yKElEQktleVJhbmdlLm9ubHkoaWQpKTtcbiAgICAgICAgICAgICAgICBxdWVyeS5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvLmRlbGV0ZShjdXJzb3IucHJpbWFyeUtleSk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdHhuLm9uY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHR4bi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBkZWxldGUgbG9ncyBmb3IgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAnJHtpZH0nIDogJHtldmVudC50YXJnZXQuZXJyb3JDb2RlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gZGVsZXRlIGxhc3QgbW9kaWZpZWQgZW50cmllc1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RNb2RTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShcImxvZ3NsYXN0bW9kXCIpO1xuICAgICAgICAgICAgICAgIGxhc3RNb2RTdG9yZS5kZWxldGUoaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbGxMb2dJZHMgPSBhd2FpdCBmZXRjaExvZ0lkcygpO1xuICAgICAgICBsZXQgcmVtb3ZlTG9nSWRzID0gW107XG4gICAgICAgIGNvbnN0IGxvZ3MgPSBbXTtcbiAgICAgICAgbGV0IHNpemUgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbExvZ0lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbGluZXMgPSBhd2FpdCBmZXRjaExvZ3MoYWxsTG9nSWRzW2ldLCBNQVhfTE9HX1NJWkUgLSBzaXplKTtcblxuICAgICAgICAgICAgLy8gYWx3YXlzIGFkZCB0aGUgbG9nIGZpbGU6IGZldGNoTG9ncyB3aWxsIHRydW5jYXRlIG9uY2UgdGhlIG1heFNpemUgd2UgZ2l2ZSBpdCBpc1xuICAgICAgICAgICAgLy8gZXhjZWVkZWQsIHNvIHdlJ2xsIGdvIG92ZXIgdGhlIG1heCBidXQgb25seSBieSBvbmUgZnJhZ21lbnQncyB3b3J0aC5cbiAgICAgICAgICAgIGxvZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgbGluZXM6IGxpbmVzLFxuICAgICAgICAgICAgICAgIGlkOiBhbGxMb2dJZHNbaV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNpemUgKz0gbGluZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICAvLyBJZiBmZXRjaExvZ3MgdHJ1bmNhdGVkIHdlJ2xsIG5vdyBiZSBhdCBvciBvdmVyIHRoZSBzaXplIGxpbWl0LFxuICAgICAgICAgICAgLy8gaW4gd2hpY2ggY2FzZSB3ZSBzaG91bGQgc3RvcCBhbmQgcmVtb3ZlIHRoZSByZXN0IG9mIHRoZSBsb2cgZmlsZXMuXG4gICAgICAgICAgICBpZiAoc2l6ZSA+PSBNQVhfTE9HX1NJWkUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgcmVtYWluaW5nIGxvZyBJRHMgc2hvdWxkIGJlIHJlbW92ZWQuIElmIHdlIGdvIG91dCBvZlxuICAgICAgICAgICAgICAgIC8vIGJvdW5kcyB0aGlzIGlzIGp1c3QgW11cbiAgICAgICAgICAgICAgICByZW1vdmVMb2dJZHMgPSBhbGxMb2dJZHMuc2xpY2UoaSArIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbW92ZUxvZ0lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92aW5nIGxvZ3M6IFwiLCByZW1vdmVMb2dJZHMpO1xuICAgICAgICAgICAgLy8gRG9uJ3QgYXdhaXQgdGhpcyBiZWNhdXNlIGl0J3Mgbm9uLWZhdGFsIGlmIHdlIGNhbid0IGNsZWFuIHVwXG4gICAgICAgICAgICAvLyBsb2dzLlxuICAgICAgICAgICAgUHJvbWlzZS5hbGwocmVtb3ZlTG9nSWRzLm1hcCgoaWQpID0+IGRlbGV0ZUxvZ3MoaWQpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlbW92ZWQgJHtyZW1vdmVMb2dJZHMubGVuZ3RofSBvbGQgbG9ncy5gKTtcbiAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9ncztcbiAgICB9XG5cbiAgICBfZ2VuZXJhdGVMb2dFbnRyeShsaW5lcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICBsaW5lczogbGluZXMsXG4gICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCsrLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9nZW5lcmF0ZUxhc3RNb2RpZmllZFRpbWUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHRzOiBEYXRlLm5vdygpLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIGNvbGxlY3QgcmVzdWx0cyBmcm9tIGEgQ3Vyc29yIGFuZCBwcm9taXNlaWZ5IGl0LlxuICogQHBhcmFtIHtPYmplY3RTdG9yZXxJbmRleH0gc3RvcmUgVGhlIHN0b3JlIHRvIHBlcmZvcm0gb3BlbkN1cnNvciBvbi5cbiAqIEBwYXJhbSB7SURCS2V5UmFuZ2U9fSBrZXlSYW5nZSBPcHRpb25hbCBrZXkgcmFuZ2UgdG8gYXBwbHkgb24gdGhlIGN1cnNvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlc3VsdE1hcHBlciBBIGZ1bmN0aW9uIHdoaWNoIGlzIHJlcGVhdGVkbHkgY2FsbGVkIHdpdGggYVxuICogQ3Vyc29yLlxuICogUmV0dXJuIHRoZSBkYXRhIHlvdSB3YW50IHRvIGtlZXAuXG4gKiBAcmV0dXJuIHtQcm9taXNlPFRbXT59IFJlc29sdmVzIHRvIGFuIGFycmF5IG9mIHdoYXRldmVyIHlvdSByZXR1cm5lZCBmcm9tXG4gKiByZXN1bHRNYXBwZXIuXG4gKi9cbmZ1bmN0aW9uIHNlbGVjdFF1ZXJ5KHN0b3JlLCBrZXlSYW5nZSwgcmVzdWx0TWFwcGVyKSB7XG4gICAgY29uc3QgcXVlcnkgPSBzdG9yZS5vcGVuQ3Vyc29yKGtleVJhbmdlKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIHF1ZXJ5Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJRdWVyeSBmYWlsZWQ6IFwiICsgZXZlbnQudGFyZ2V0LmVycm9yQ29kZSkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBjb2xsZWN0IHJlc3VsdHNcbiAgICAgICAgcXVlcnkub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gZW5kIG9mIHJlc3VsdHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHRNYXBwZXIoY3Vyc29yKSk7XG4gICAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmUgcmFnZSBzaGFraW5nIHN1cHBvcnQgZm9yIHNlbmRpbmcgYnVnIHJlcG9ydHMuXG4gKiBNb2RpZmllcyBnbG9iYWxzLlxuICogQHJldHVybiB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiBzZXQgdXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuICAgIGlmIChnbG9iYWwubXhfcmFnZV9pbml0UHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLm14X3JhZ2VfaW5pdFByb21pc2U7XG4gICAgfVxuICAgIGdsb2JhbC5teF9yYWdlX2xvZ2dlciA9IG5ldyBDb25zb2xlTG9nZ2VyKCk7XG4gICAgZ2xvYmFsLm14X3JhZ2VfbG9nZ2VyLm1vbmtleVBhdGNoKHdpbmRvdy5jb25zb2xlKTtcblxuICAgIC8vIGp1c3QgKmFjY2Vzc2luZyogaW5kZXhlZERCIHRocm93cyBhbiBleGNlcHRpb24gaW4gZmlyZWZveCB3aXRoXG4gICAgLy8gaW5kZXhlZGRiIGRpc2FibGVkLlxuICAgIGxldCBpbmRleGVkREI7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5kZXhlZERCID0gd2luZG93LmluZGV4ZWREQjtcbiAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgaWYgKGluZGV4ZWREQikge1xuICAgICAgICBnbG9iYWwubXhfcmFnZV9zdG9yZSA9IG5ldyBJbmRleGVkREJMb2dTdG9yZShpbmRleGVkREIsIGdsb2JhbC5teF9yYWdlX2xvZ2dlcik7XG4gICAgICAgIGdsb2JhbC5teF9yYWdlX2luaXRQcm9taXNlID0gZ2xvYmFsLm14X3JhZ2Vfc3RvcmUuY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gZ2xvYmFsLm14X3JhZ2VfaW5pdFByb21pc2U7XG4gICAgfVxuICAgIGdsb2JhbC5teF9yYWdlX2luaXRQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgcmV0dXJuIGdsb2JhbC5teF9yYWdlX2luaXRQcm9taXNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgaWYgKCFnbG9iYWwubXhfcmFnZV9zdG9yZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGdsb2JhbC5teF9yYWdlX3N0b3JlLmZsdXNoKCk7XG59XG5cbi8qKlxuICogQ2xlYW4gdXAgb2xkIGxvZ3MuXG4gKiBAcmV0dXJuIFByb21pc2UgUmVzb2x2ZXMgaWYgY2xlYW5lZCBsb2dzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBpZiAoIWdsb2JhbC5teF9yYWdlX3N0b3JlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgZ2xvYmFsLm14X3JhZ2Vfc3RvcmUuY29uc3VtZSgpO1xufVxuXG4vKipcbiAqIEdldCBhIHJlY2VudCBzbmFwc2hvdCBvZiB0aGUgbG9ncywgcmVhZHkgZm9yIGF0dGFjaGluZyB0byBhIGJ1ZyByZXBvcnRcbiAqXG4gKiBAcmV0dXJuIHtBcnJheTx7bGluZXM6IHN0cmluZywgaWQsIHN0cmluZ30+fSAgbGlzdCBvZiBsb2cgZGF0YVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TG9nc0ZvclJlcG9ydCgpIHtcbiAgICBpZiAoIWdsb2JhbC5teF9yYWdlX2xvZ2dlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIk5vIGNvbnNvbGUgbG9nZ2VyLCBkaWQgeW91IGZvcmdldCB0byBjYWxsIGluaXQoKT9cIixcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLy8gSWYgaW4gaW5jb2duaXRvIG1vZGUsIHN0b3JlIGlzIG51bGwsIGJ1dCB3ZSBzdGlsbCB3YW50IGJ1ZyByZXBvcnRcbiAgICAvLyBzZW5kaW5nIHRvIHdvcmsgZ29pbmcgb2ZmIHRoZSBpbi1tZW1vcnkgY29uc29sZSBsb2dzLlxuICAgIGlmIChnbG9iYWwubXhfcmFnZV9zdG9yZSkge1xuICAgICAgICAvLyBmbHVzaCBtb3N0IHJlY2VudCBsb2dzXG4gICAgICAgIGF3YWl0IGdsb2JhbC5teF9yYWdlX3N0b3JlLmZsdXNoKCk7XG4gICAgICAgIHJldHVybiBhd2FpdCBnbG9iYWwubXhfcmFnZV9zdG9yZS5jb25zdW1lKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICBsaW5lczogZ2xvYmFsLm14X3JhZ2VfbG9nZ2VyLmZsdXNoKHRydWUpLFxuICAgICAgICAgICAgaWQ6IFwiLVwiLFxuICAgICAgICB9XTtcbiAgICB9XG59XG4iXX0=