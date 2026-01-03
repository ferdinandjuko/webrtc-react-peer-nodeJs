// fichier Room.tsx
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { RoomContext } from "../context/RoomContext";
import { VideoPlayer } from "../components/VideoPlayer";
import { PeerState } from "../context/peerReducer";

export const Room = () => {
    //const { roomId, viewerStatus } = useParams()<>;
    const { roomId, viewerStatus } = useParams<{ roomId: string, viewerStatus: string }>()
    const { ws, me, stream, peers, participantsCount, viewers, viewersCount, isViewer } = useContext(RoomContext);
    const [isViewerStatus, setIsViewerStatus] = useState<boolean>(false);

    useEffect(() => {
        if(me) ws.current.emit("join-room", {roomId: roomId, peerId: me._id});
        console.log("viewerStatusType=> ",typeof(viewerStatus));

        if(viewerStatus === "false") {
            setIsViewerStatus(false);
        } else {
            setIsViewerStatus(true);
        }
    }, [roomId, ws , me, viewerStatus]);
    console.log("isViewerStatus=> ",isViewerStatus)
    return (
        <>
            Room Id localhost:3000/room/{roomId}/true
            <br/>
            {console.log("isViewerStatus=> ",typeof(isViewerStatus), " ", isViewerStatus)}
            <div className="grid grid-cols-4 gap-4">
                {/* <VideoPlayer stream={stream} /> */}
                 {isViewerStatus ? "viewer" : <VideoPlayer stream={stream} />}
                {/*Object.values(peers as PeerState).map((peer) => (
                    <VideoPlayer stream={peer.stream} />
                ))*/}
                
            </div>
            <p>Participants: {participantsCount}</p>
            <p>Viewers: {viewersCount}</p>
            <p>Viewer List: {viewers.join(", ")}</p>
            <button >{isViewerStatus ? "viewer" : "streamer"}</button>
            {isViewerStatus && Object.values(peers as PeerState).map((peer) => (
                    <VideoPlayer key={peer.stream.id} stream={peer.stream} />
            ))}
        </>
    )
}