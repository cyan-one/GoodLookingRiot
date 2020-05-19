interface Client {
    getUserId: () => string;
    checkUserTrust: (userId: string) => {
        isCrossSigningVerified: () => boolean;
        wasCrossSigningVerified: () => boolean;
    };
    getStoredDevicesForUser: (userId: string) => [{
        deviceId: string;
    }];
    checkDeviceTrust: (userId: string, deviceId: string) => {
        isVerified: () => boolean;
    };
}
interface Room {
    getEncryptionTargetMembers: () => Promise<[{
        userId: string;
    }]>;
    roomId: string;
}
export declare function shieldStatusForRoom(client: Client, room: Room): Promise<string>;
export {};
