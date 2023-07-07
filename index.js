const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Instagram Basic Display API credentials
const clientID = process.env.INSTAGRAM_APP_ID;
const clientSecret = process.env.INSTAGRAM_APP_SECRET;
const redirectURI = 'http://localhost:3000/auth/instagram/callback'

// Login route - redirects user to Instagram login
app.get('/auth/instagram', (req, res) => {
  const authURL = `https://api.instagram.com/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authURL);
});

// Callback route - exchanges code for access token and fetches user details and media
app.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange authorization code for access token
    const response = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectURI,
      code: code,
    });

    const accessToken = response.data.access_token;
    const userID = response.data.user_id;

    // Fetch user details
    const userResponse = await axios.get(`https://graph.instagram.com/${userID}`, {
      params: {
        fields: 'id,username,followers_count,follows_count',
        access_token: accessToken,
      },
    });

    const user = userResponse.data;

    // Fetch user media (posts)
    const mediaResponse = await axios.get(`https://graph.instagram.com/${userID}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,like_count',
        access_token: accessToken,
      },
    });

    const media = mediaResponse.data.data;

    // Prepare response data
    const responseData = {
      name: user.username,
      username: user.username,
      followers: user.followers_count,
      following: user.follows_count,
      posts: media.map(post => ({
        image: post.media_url,
        caption: post.caption,
        likeCount: post.like_count,
      })),
    };

    // Send response
    res.json(responseData);
  } catch (error) {
    console.error('Error:', error.response.data);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
