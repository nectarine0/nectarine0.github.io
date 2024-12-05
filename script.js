// Replace with your Spotify app credentials and token-handling logic
const CLIENT_ID = "<2464cdec15494405943465280fe5849e>";
const REDIRECT_URI = "https://nectarine0.github.io"; // Replace with your redirect URI

let accessToken;

// Helper function to authenticate with Spotify
function authenticateSpotify() {
  const scopes = encodeURIComponent("playlist-modify-public playlist-modify-private");
  const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}`;
  window.location.href = authUrl;
}

// Extract the token from the URL (after authentication)
function getAccessToken() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  accessToken = params.get("access_token");
}

// Fetch tracks based on mood
async function fetchTracks(mood) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.tracks.items.map((track) => track.uri);
}

// Create a playlist
async function createPlaylist(mood) {
  const userResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userResponse.json();
  const userId = userData.id;

  const playlistResponse = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood Playlist`,
        description: `A playlist for when you're feeling ${mood}`,
        public: true,
      }),
    }
  );

  return await playlistResponse.json();
}

// Add tracks to playlist
async function addTracksToPlaylist(playlistId, trackUris) {
  await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });
}

// Handle button click
document.getElementById("generate").addEventListener("click", async () => {
  const mood = document.getElementById("mood").value.trim();
  const statusText = document.getElementById("status");

  if (!mood) {
    statusText.textContent = "Please enter a mood.";
    return;
  }

  if (!accessToken) {
    authenticateSpotify();
    return;
  }

  statusText.textContent = "Generating playlist...";

  try {
    const trackUris = await fetchTracks(mood);
    const playlist = await createPlaylist(mood);
    await addTracksToPlaylist(playlist.id, trackUris);
    statusText.textContent = `Playlist created: ${playlist.name}!`;
  } catch (error) {
    console.error(error);
    statusText.textContent = "An error occurred. Please try again.";
  }
});

// Extract access token on page load
getAccessToken();
