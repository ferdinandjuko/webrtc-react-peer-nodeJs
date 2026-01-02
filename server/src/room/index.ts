// server/src/room/index.ts
import { Socket } from "socket.io";
import {v4 as uuidV4} from "uuid";

const rooms: Record<string, string[]> = {};

interface IRoomParams {
    roomId: string;
    peerId: string;
    viewerStatus: boolean;
}

export const roomHandler = (socket: Socket) => {
    const createRoom = () => {
        const roomId = uuidV4();
        const viewerStatus = false;
        rooms[roomId] = [];
        // socket.join(roomId);
        socket.emit("room-created", { roomId, viewerStatus });
        console.log("user created the room");
    }
    const joinRoom = ({roomId, peerId}: IRoomParams) => {
        if (!rooms[roomId]) {
            // Si la salle n'existe pas, la créer et initialiser le tableau
            rooms[roomId] = [];
        }
        if(rooms[roomId]) {
            const viewerStatus = true;
            console.log("user joinded the room", roomId, " ", peerId);
            rooms[roomId].push(peerId);
            socket.join(roomId);
            socket.to(roomId).emit("user-joined", {peerId, viewerStatus});
            socket.emit("get-users", {
                roomId,
                participants: rooms[roomId],
            })
        }


        socket.on("disconnect", () => {
            const viewerStatus = true;
            console.log("user left the room ", peerId);
            leaveRoom({roomId, peerId, viewerStatus});
        });

    };

    const leaveRoom = ({roomId, peerId}: IRoomParams) => {
        rooms[roomId] = rooms[roomId].filter((id) => id !== peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
     }

    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
};