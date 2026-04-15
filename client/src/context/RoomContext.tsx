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
    const [participantsCount, setParticipantsCount] = useState<number>(0);
    const [participants, setParticipants] = useState<string[]>([]);
    const [viewersCount, setViewersCount] = useState<number>(0);
    const [viewers, setViewers] = useState<string[]>([]);
    const [isViewer, setIsViewer] = useState(true);

    const enterRoom = ({roomId, viewerStatus}: {roomId: "string", viewerStatus: boolean}) => {
        navigate(`/room/${roomId}/${viewerStatus}`);
        console.log("enterRoom=> ",viewerStatus);
        setIsViewer(viewerStatus);
    };

    const getUsers = ({participants}: {participants: string[]}) => {
        console.log("participants=> ",participants.length -1 );
        setParticipantsCount(participants.length - 1);
        setParticipants(participants);
    }

    const getViewer = ({ viewerId }: { viewerId: string }) => {
        console.log("new viewer joined=> ", viewerId);
        setViewers((prevViewers) => [...prevViewers, viewerId]);
        setViewersCount((prevCount) => prevCount + 1);
    };

    const getStream = async () => {
        console.log("getStream=> ", isViewer);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isViewer, // permet à l'utilisateur de voir ou non sa propre vidéo
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
        console.log("getStreamViewer=> ", isViewer);
        getStream();

        ws.current.on("room-created", enterRoom);
        ws.current.on("get-users", getUsers);
        ws.current.on("user-disconnected", removePeer);
    }, []);

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
            // Update viewers count
            setViewersCount((prevCount) => prevCount + 1);
            if (!participants.includes(peerId)) {
                getViewer({ viewerId: peerId });
            }
        })

        me.on('call', (call) => { // we answer the call
            call.answer(stream);
            call.on("stream", (peerStream) => {
                console.log("peerStream=> ",peerStream);
                dispatch(addPeerAction(call.peer, peerStream));
            })
             // Update viewers count
             setViewersCount((prevCount) => prevCount + 1);
            if (!participants.includes(call.peer)) {
                getViewer({ viewerId: call.peer });
            }
        })
    }, [me, stream]);

    console.log("peers=> ",{ peers });

    return (
        <RoomContext.Provider value={{ ws, me, stream, peers, participantsCount, viewers, viewersCount }}>
            {children}
        </RoomContext.Provider>
    );
};
