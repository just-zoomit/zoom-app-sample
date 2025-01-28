/* globals zoomSdk */
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apis } from "./apis";
import { Authorization } from "./components/Authorization";
import Installer from "./components/externalBrowserComponents/InstallButton";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const useZoomSdkConfig = (setRunningContext, setUserContextStatus, setError, setIsZoom) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const configureSdk = async () => {
      const configTimer = setTimeout(() => {
        setCounter((prev) => prev + 1);
      }, 120 * 60 * 1000); // 2-hour timeout

      try {
        // Try to configure the Zoom SDK to confirm we are in the Zoom embedded browser
        const configResponse = await zoomSdk.config({
          capabilities: [
            ...apis.map((api) => api.name),
            "onSendAppInvitation",
            "onShareApp",
            "onActiveSpeakerChange",
            "onMeeting",
            "connect",
            "onConnect",
            "postMessage",
            "onMessage",
            "authorize",
            "onAuthorized",
            "promptAuthorize",
            "getUserContext",
            "onMyUserContextChange",
            "sendAppInvitationToAllParticipants",
            "sendAppInvitation",
          ],
          version: "0.16.0",
        });

        console.log("App configured", configResponse);
        setRunningContext(configResponse.runningContext);
        setUserContextStatus(configResponse.auth.status);
        setIsZoom(true); // Confirm that the app is running inside Zoom

        zoomSdk.onSendAppInvitation((data) => console.log(data));
        zoomSdk.onShareApp((data) => console.log(data));
      } catch (error) {
        console.error("Error configuring Zoom SDK:", error);
        setError("There was an error configuring the JS SDK");
        setIsZoom(false); // Mark as not running in Zoom
      }

      return () => clearTimeout(configTimer);
    };

    configureSdk();
  }, [counter, setRunningContext, setUserContextStatus, setError, setIsZoom]);
};


const usePreMeeting = (runningContext, preMeeting, setPreMeeting) => {
  useEffect(() => {
    if (runningContext === "inMainClient" && preMeeting) {
      const onMessageHandler = (message) => {
        const content = message.payload.payload;

        if (content === "connected" && preMeeting) {
          console.log("Meeting instance exists.");
          zoomSdk.removeEventListener("onMessage", onMessageHandler);
          console.log("Client state synced with meeting instance.");
          setPreMeeting(false);
        }
      };

      zoomSdk.addEventListener("onMessage", onMessageHandler);
      return () => zoomSdk.removeEventListener("onMessage", onMessageHandler);
    }
  }, [runningContext, preMeeting, setPreMeeting]);
};

const useInstanceCommunication = (
  runningContext,
  connected,
  setConnected,
  preMeeting,
  setPreMeeting,
  location,
  navigate
) => {
  const sendMessage = useCallback(async (msg, sender) => {
    console.log(`Message sent from ${sender} with data: ${JSON.stringify(msg)}`);
    await zoomSdk.postMessage({ payload: msg });
  }, []);

  const handleMessage = useCallback(
    (receiver, reason = "") => {
      const onMessageHandler = (message) => {
        const content = message.payload.payload;
        console.log(`Message received ${receiver} ${reason}: ${content}`);
        navigate({ pathname: content });
      };

      zoomSdk.addEventListener("onMessage", onMessageHandler);
      return () => zoomSdk.removeEventListener("onMessage", onMessageHandler);
    },
    [navigate]
  );

  useEffect(() => {
    const connectInstances = async () => {
      if (runningContext === "inMeeting" && !connected) {
        zoomSdk.addEventListener("onConnect", () => {
          console.log("Connected");
          setConnected(true);

          if (preMeeting) {
            sendMessage("connected", "meeting");
            zoomSdk.addEventListener("onMessage", (message) => {
              const content = message.payload.payload;
              console.log(
                "Client state received, updating meeting instance:",
                content
              );
              window.location.replace(content);
              setPreMeeting(false);
            });
          }
        });

        console.log("Connecting...");
        await zoomSdk.connect();
      }
    };

    if (!connected) {
      connectInstances();
    }
  }, [connected, runningContext, preMeeting, sendMessage, setConnected, setPreMeeting]);

  useEffect(() => {
    if (runningContext === "inMeeting" && connected && !preMeeting) {
      sendMessage(location.pathname, "inMeeting");
    } else if (runningContext === "inMainClient" && !preMeeting) {
      handleMessage("client", "for tab change");
    }
  }, [connected, location.pathname, preMeeting, runningContext, sendMessage, handleMessage]);
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [runningContext, setRunningContext] = useState(null);
  const [connected, setConnected] = useState(false);
  const [preMeeting, setPreMeeting] = useState(true);
  const [userContextStatus, setUserContextStatus] = useState("");
  const [isZoom, setIsZoom] = useState(null); // Track whether we are in Zoom

  useZoomSdkConfig(setRunningContext, setUserContextStatus, setError, setIsZoom);
  usePreMeeting(runningContext, preMeeting, setPreMeeting);
  useInstanceCommunication(
    runningContext,
    connected,
    setConnected,
    preMeeting,
    setPreMeeting,
    location,
    navigate
  );

  if (isZoom === null) {
    // Render a loading spinner or placeholder while determining the environment

    console.log("Detecting environment...");
    return (
      <div className="App">
        <p>Detecting environment...</p>
      </div>
    );
  }

  if (!isZoom) {
    // Render the Installer component if not running in Zoom
    return (
      <div className="App">
        <Installer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <h1>
          Error From External Browser: <br /> {error}
        </h1>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>
        User Name:{" "}
        {user ? `${user.first_name} ${user.last_name}` : "Zoom Apps user"}!
      </h1>
      <p>User Context Status: {userContextStatus}</p>
      <p>
        {runningContext
          ? `Running Context: ${runningContext}`
          : "Configuring Zoom JavaScript SDK..."}
      </p>
      <Authorization
        handleError={setError}
        handleUserContextStatus={setUserContextStatus}
        handleUser={setUser}
        user={user}
        userContextStatus={userContextStatus}
      />
    </div>
  );
}

export default App;
