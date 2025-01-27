import Button from "react-bootstrap/Button";
import "./UserInfo.css";

// Reusable components
const OAuthPrompt = ({ onClick }) => (
  <>
    <h1>In-client Add</h1>
    <p>
      User has authorized your app and added, but the app does not know this or
      does not have a REST API access token. Click below to invoke the
      authorize API, perform 'In-client OAuth', and receive/save the access
      token for this user.
    </p>
    <p>
      (If you've called this API before, you may be seeing this because your
      embedded browser session expired or was forgotten during a Docker
      restart. Please try closing and re-opening, or re-installing the
      application.)
    </p>
    <Button variant="primary" onClick={onClick}>
      Authorize
    </Button>
  </>
);  

const GuestModePrompt = ({ userContextStatus, onClick }) => {
  const bodyText =
    userContextStatus === "unauthenticated"
      ? "This user is unauthenticated. Zoom does not know the user, and only some Zoom App APIs are allowed. Invoking promptAuthorize will ask the user to log in to Zoom."
      : "This user is authenticated, but they have not yet added the app and/or consented to app scopes. Invoke promptAuthorize once more to ask the authenticated user to consent and add the app (this will invoke the In-client OAuth flow).";

  return (
    <>
      <h1>You are in Guest Mode</h1>
      <p>{bodyText}</p>
      <p>Not all APIs will be available in Guest Mode</p>
      <Button onClick={onClick}>promptAuthorize</Button>
    </>
  );
};

const LoadingMessage = () => (
  <p className="p-loading"> Loading Zoom User . . .</p>
);

const UserDetails = ({ user }) => (
  <div>
    <pre className="pre-userinfo">{JSON.stringify(user, null, 2)}</pre>
  </div>
);

function UserInfo({
  user,
  showInClientOAuthPrompt,
  showGuestModePrompt,
  onClick,
  userContextStatus,
}) {
  if (showInClientOAuthPrompt) {
    return <OAuthPrompt onClick={onClick} />;
  }

  if (showGuestModePrompt) {
    return (
      <GuestModePrompt
        userContextStatus={userContextStatus}
        onClick={onClick}
      />
    );
  }

  if (!user) {
    return <LoadingMessage />;
  }

  return <UserDetails user={user} />;
}

export default UserInfo;
