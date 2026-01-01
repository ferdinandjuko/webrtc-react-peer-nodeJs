//  fichier RoomContenxt.tsx
import { io } from 'socket.io-client';
import { createContext, useEffect, useRef, useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import {v4 as uuidV4 } from "uuid";
import { peersReducer } from './peerReducer';
import { addPeerAction, removePeerAction } from './peerActions';
// import useMediaRecorder from 'use-media-recorder';

const host ="http://localhost:5000";

export const RoomContext = createContext<null | any>(null);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ws = useRef(io(host));
    const navigate = useNavigate();
    const [me, setMe] = useState<Peer>();
    const [stream, setStream] = useState<MediaStream>();
    const [peers, dispatch] = useReducer(peersReducer, {});

    const enterRoom = ({roomId}: {roomId: "string"}) => {
        navigate(`/room/${roomId}`)
    };

    const getUsers = ({participants}: {participants: string[]}) => {
        console.log("participants=> ",participants);
    }

    // const { startRecording, stopRecording, mediaBlob } = useMediaRecorder({
    //     video: true,
    //     onStop: (blob: Blob) => {
    //         // Utilisez le blob pour l'envoyer via le socket ou d'autres moyens
    //         console.log("Video blob:", blob);
    //         // Exemple d'envoi à travers le socket
    //         ws.current.emit("send-video", blob);
    //     },
    // });

    // const [isRecording, setIsRecording] = useState(false);
    // const [setCaptureRef, data, err] = useMediaRecorder({ isRecording });

    const getStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            setStream(stream);
        } catch (error) {
            const _error = (error as Error).message;
            console.log("_error=> ",_error);
            if(_error === "Permission denied by system") {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true
                    });
                    setStream(stream);
                } catch (error) {
                    console.log("error=> ",error);
                }
            }
        }
    }

    const removePeer = (peerId: string) => {
        dispatch(removePeerAction(peerId));
    }

    useEffect(() => {
        const meId = uuidV4();
        const peer = new Peer(meId);
        setMe(peer);
        getStream();

        ws.current.on("room-created", enterRoom);
        ws.current.on("get-users", getUsers);
        ws.current.on("user-disconnected", removePeer);
    }, [])

    useEffect(() => {
        if(!me) return;
        if(!stream) return;

        ws.current.on("user-joined", ({ peerId }) => { // we init the call
            const call = me.call(peerId, stream);
            console.log("call=> ",call);
            call.on("stream", (peerStream) => {
                console.log("peerStream=> ",peerStream);
                dispatch(addPeerAction(peerId, peerStream));
            });
        })

        me.on('call', (call) => { // we answer the call
            call.answer(stream);
            call.on("stream", (peerStream) => {
                console.log("peerStream=> ",peerStream);
                dispatch(addPeerAction(call.peer, peerStream));
            })
        })
    }, [me, stream]);

    console.log("peers=> ",{ peers });

    return (
        <RoomContext.Provider value={{ ws, me, stream, peers }}>
            {children}
        </RoomContext.Provider>
    );
};
