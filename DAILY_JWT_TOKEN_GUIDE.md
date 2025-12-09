# Daily.co JWT Meeting Token Complete Guide

## Overview
Daily.co meeting tokens are **JSON Web Tokens (JWTs)** used to control room access and session configuration on a per-user basis. They are signed but not encrypted, so you can decode them yourself using jwt.io if needed.

---

## JWT Structure

A Daily.co JWT has three base64-encoded parts separated by periods:

```
header.payload.signature
```

### Example JWT (from Daily docs):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE1NDg3MjE1NjksImV4cCI6MTg2NDA4MTUzOCwiciI6ImhlbGxvIiwibyI6dHJ1ZSwic3MiOnRydWUsImVyIjoibG9jYWwiLCJkIjoiMjVkZjUwNTctZWYwZC00ZDk3LWJkZTYtMGNmMjg3Mjc2Y2JiIiwiaWF0IjoxNTQ4NzIxODMxfQ.mvVciAengBR4xCblhFpo4mKYftQv1skYO4Y6IKr9Zgo
```

When decoded, the payload contains:
```json
{
  "nbf": 1548721569,
  "exp": 1864081538,
  "r": "hello",
  "o": true,
  "ss": true,
  "er": "local",
  "d": "25df5057-ef0d-4d97-bde6-0cf287276cbb",
  "iat": 1548721831
}
```

---

## Required vs. Optional Claims

### **MINIMUM REQUIRED CLAIMS (for self-signed tokens):**

| Claim | Full Name | Type | Description | Example |
|-------|-----------|------|-------------|---------|
| `r` | room_name | string | **REQUIRED** - The room this token is valid for. If not set, token is valid for ALL rooms on your domain. | `"hello"` |
| `d` | domain_id | string | **REQUIRED** - Your Daily domain UUID. Get from domain configuration endpoint | `"25df5057-ef0d-4d97-bde6-0cf287276cbb"` |
| `iat` | issued_at | integer | Unix timestamp when token was created | `1548721831` |

### **STRONGLY RECOMMENDED CLAIMS:**

| Claim | Full Name | Type | Description | Example |
|-------|-----------|------|-------------|---------|
| `exp` | expires | integer | **HIGHLY RECOMMENDED** - Unix timestamp when token expires. Without this, token is valid forever. | `1864081538` |
| `nbf` | not_before | integer | Unix timestamp before which token cannot be used | `1548721569` |

### **OPTIONAL PERMISSION & FEATURE CLAIMS:**

| Claim | Full Name | Type | Description |
|-------|-----------|------|-------------|
| `o` | is_owner | boolean | Grants meeting owner privileges |
| `u` | user_name | string | User's display name in the meeting |
| `ud` | user_id | string | Unique user ID (max 36 chars, UUID recommended for HIPAA) |
| `ss` | enable_screenshare | boolean | Allow screen sharing (default: true) |
| `er` | enable_recording | string | Recording mode: "cloud", "local", or "raw-tracks" |
| `ao` | start_audio_off | boolean | Start with audio off (default: false) |
| `vo` | start_video_off | boolean | Start with video off (default: false) |
| `ctoe` | close_tab_on_exit | boolean | Close browser tab when user leaves |
| `rome` | redirect_on_meeting_exit | string | URL to redirect to when user exits |
| `k` | knocking | boolean | Require access request (with enable_knocking) |
| `ejt` | eject_at_token_exp | boolean | Kick user out when token expires |
| `eje` | eject_after_elapsed | integer | Kick out after N seconds in meeting |
| `uil` | lang | string | UI language setting |
| `sr` | start_cloud_recording | boolean | Auto-start cloud recording |
| `sro` | start_cloud_recording_opts | object | Cloud recording options |
| `ast` | auto_start_transcription | boolean | Auto-start transcription |
| `erui` | enable_recording_ui | boolean | Show recording button in UI |
| `p` | permissions | object | Participant permissions object |

### **PERMISSIONS OBJECT (nested `p` claim):**

```json
{
  "p": {
    "hp": boolean,           // hasPresence - appear in participants list
    "cs": boolean | string,  // canSend: true/false or "v,a,sv,sa" (video, audio, screenVideo, screenAudio)
    "cr": {                  // canReceive
      "b": boolean | {...}   // base: all or specific media types
    },
    "ca": boolean | array    // canAdmin: true/false or ["participants", "streaming", "transcription"]
  }
}
```

---

## Complete Token Examples

### **Minimal Valid Token (Full Name Claims):**
```json
{
  "room_name": "my-room",
  "domain_id": "YOUR-DOMAIN-UUID",
  "iat": 1710000000,
  "exp": 1710003600
}
```

### **Minimal Valid Token (Abbreviated Claims - for self-signing):**
```json
{
  "r": "my-room",
  "d": "YOUR-DOMAIN-UUID",
  "iat": 1710000000,
  "exp": 1710003600
}
```

### **Full-Featured Token:**
```json
{
  "r": "my-room",
  "d": "25df5057-ef0d-4d97-bde6-0cf287276cbb",
  "iat": 1710000000,
  "nbf": 1710000000,
  "exp": 1710003600,
  "o": true,
  "u": "John Doe",
  "ud": "user-123",
  "ss": true,
  "er": "cloud",
  "ao": false,
  "vo": false,
  "ejt": true,
  "p": {
    "hp": true,
    "cs": "v,a",
    "cr": { "b": true },
    "ca": ["participants"]
  }
}
```

---

## How to Generate JWT Tokens

### **Option 1: Using Daily's REST API (Recommended for Production)**

```bash
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -XPOST -d '{
    "properties": {
      "room_name": "my-room",
      "exp": '$(expr $(date +%s) + 3600)'
    }
  }' \
  https://api.daily.co/v1/meeting-tokens
```

### **Option 2: Self-Signing with Node.js (Using jsonwebtoken library)**

```javascript
import * as jwt from 'jsonwebtoken';

function generateMeetingToken() {
  const payload = {
    r: 'my-room-name',           // room_name (abbreviated)
    d: 'YOUR-DOMAIN-UUID',       // domain_id (abbreviated)
    iat: Math.floor(Date.now() / 1000),  // issued_at
    exp: Math.floor(Date.now() / 1000) + 3600  // expires in 1 hour
  };
  
  try {
    const token = jwt.sign(payload, DAILY_API_KEY, { 
      algorithm: 'HS256'
    });
    return token;
  } catch (e) {
    throw new Error(`failed to create self-signed JWT: ${e.toString()}`);
  }
}
```

### **Option 3: Manual JWT Creation with HMAC-SHA256**

1. Create header: `{"alg":"HS256","typ":"JWT"}`
2. Base64-encode header
3. Create payload with claims (see examples above)
4. Base64-encode payload
5. Sign: `HMAC-SHA256(header.payload, DAILY_API_KEY)`
6. Base64-encode signature
7. Combine: `header.payload.signature`

---

## Token Claims Abbreviations (Complete Reference)

| Full Name | Abbreviation | Type | Default |
|-----------|--------------|------|---------|
| not_before | nbf | integer | - |
| expires | exp | integer | - |
| domain_id | d | string | - |
| room_name | r | string | - |
| user_id | ud | string | - |
| user_name | u | string | - |
| is_owner | o | boolean | false |
| knocking | k | boolean | false |
| close_tab_on_exit | ctoe | boolean | false |
| redirect_on_meeting_exit | rome | string | - |
| start_cloud_recording | sr | boolean | false |
| start_cloud_recording_opts | sro | object | - |
| auto_start_transcription | ast | boolean | false |
| enable_recording | er | string | - |
| enable_screenshare | ss | boolean | true |
| start_video_off | vo | boolean | false |
| start_audio_off | ao | boolean | false |
| eject_at_token_exp | ejt | boolean | false |
| eject_after_elapsed | eje | integer | - |
| lang | uil | string | "en" |
| enable_recording_ui | erui | boolean | - |
| permissions | p | object | - |
| intercom_join_alert | ij | boolean | - |
| meeting_join_hook | mjh | string | - |
| issued_at | iat | integer | - |

---

## Important Security Guidelines

### **DO:**
✅ Always set `room_name` (r) when using tokens to control access  
✅ Always set `exp` (expires) - recommended 1 hour or less  
✅ Set `nbf` (not_before) if joining at a specific time  
✅ Generate tokens server-side only  
✅ Use short token lifespans  
✅ Specify tokens for specific rooms (not all rooms)  
✅ For HIPAA compliance, use UUID for `user_id`  

### **DON'T:**
❌ Don't put sensitive information in tokens (they're not encrypted)  
❌ Don't create tokens without expiry times (they last forever!)  
❌ Don't generate tokens client-side in production  
❌ Don't use overly long token lifespans  
❌ Don't create tokens valid for all rooms unless necessary  

---

## Token Validation

### **Validate via Daily's REST API:**
```bash
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  https://api.daily.co/v1/meeting-tokens/$DAILY_MEETING_TOKEN
```

If valid, returns 200 with token properties. If invalid (expired, wrong domain, etc.), returns error response.

### **Validate in Your Code (self-signed tokens):**
Use a JWT library to verify:
- Signature (using your API key)
- `exp` claim hasn't passed
- `nbf` claim (if set) hasn't been reached yet
- Token belongs to your domain

---

## Using Tokens in Daily.js

```javascript
const call = Daily.createCallObject();

call.join({
  url: 'https://your-domain.daily.co/your-room',
  token: 'YOUR_JWT_MEETING_TOKEN'
});
```

---

## Error Messages & Troubleshooting

### **"Meeting token ignored: invalid-token"**
- Token signature is invalid
- Token belongs to wrong domain
- Token has expired (`exp` in the past)
- Token is not yet valid (`nbf` in the future)
- Token malformed or not a valid JWT
- API key used to sign token is no longer active

### **Verify token validity:**
1. Check `exp` timestamp is in future: `exp > Math.floor(Date.now() / 1000)`
2. Check `nbf` timestamp is in past (or absent): `nbf <= Math.floor(Date.now() / 1000)`
3. Verify domain_id (d) matches your Daily domain
4. Verify room_name (r) is spelled correctly
5. Verify API key used to sign is still active in Daily dashboard
6. Try validating with REST API endpoint

---

## Complete Self-Signing Example (Node.js)

```javascript
import jwt from 'jsonwebtoken';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN_ID = process.env.DAILY_DOMAIN_ID;

function generateMeetingToken(roomName, userName = null, isOwner = false) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    // Required
    r: roomName,
    d: DAILY_DOMAIN_ID,
    iat: now,
    
    // Recommended
    exp: now + 3600,  // 1 hour expiry
    
    // Optional - customize as needed
    ...(userName && { u: userName }),
    ...(isOwner && { o: true }),
    ss: true,  // enable screenshare
    er: 'cloud'  // enable cloud recording
  };
  
  try {
    const token = jwt.sign(payload, DAILY_API_KEY, { 
      algorithm: 'HS256'
    });
    
    console.log('Generated token:', token);
    
    // Optional: decode to verify
    const decoded = jwt.decode(token);
    console.log('Token payload:', decoded);
    
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw error;
  }
}

// Usage
const token = generateMeetingToken('meeting-room', 'John Doe', true);
```

---

## REST API Endpoint for Token Creation

### **POST** `/v1/meeting-tokens`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_DAILY_API_KEY`

**Request Body:**
```json
{
  "properties": {
    "room_name": "my-room",
    "exp": 1710003600,
    "user_name": "John Doe",
    "is_owner": false,
    "enable_screenshare": true,
    "enable_recording": "cloud"
  }
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
}
```

---

## Key Takeaways

1. **JWT structure:** `header.payload.signature` (all base64-encoded)
2. **Minimum claims:** `r` (room), `d` (domain), `iat`, `exp`
3. **Always use abbreviated claims** when self-signing for token size
4. **Always set expiry (`exp`)** - without it, tokens are valid forever
5. **Always set room (`r`)** - without it, token works on all rooms
6. **"invalid-token" error** = wrong domain, expired, malformed, or invalid signature
7. **Sign server-side only** with your Daily API key
8. **Short lifespans** (1 hour or less) are recommended
9. **Validate** using Daily's REST API or JWT library in your code
10. **Not encrypted** - don't put secrets in the token payload

