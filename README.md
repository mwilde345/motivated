# motivated
text me pictures of reddit's daily r/getmotivated

Created reddit app: https://www.reddit.com/prefs/apps
* Secret in `.env` file

OAuth: https://github.com/reddit-archive/reddit/wiki/OAuth2-Quick-Start-Example
> Access tokens expire after one hour. If your app requires access after that time, it must request a refresh token by including duration=permanent with the authorization request (see above). When the current access token expires, your app should send another POST request to the access token URL: https://www.reddit.com/api/v1/access_token with POST data: grant_type=refresh_token&refresh_token=TOKEN
```
curl -X POST -d 'grant_type=password&username=miraclebob&password=' --user 'id:secret' https://www.reddit.com/api/v1/access_token -A "motivated:1.0 by miraclebob"

{"access_token": "", "token_type": "bearer", "expires_in": 3600, "scope": "*"}

https://www.reddit.com/dev/api#GET_hot

https://oauth.reddit.com/r/GetMotivated/top?limit=1&t=all

"data.children[0].data.post_hint": "image"
"data.children[0].data.url": "https://i.redd.it/h2ql4gwqxsm01.jpg"
"data.after": "t3_85nzj1"
"data.children[0].data.is_self": false
```

at these times:
6 AM
9 AM
1 PM
4 PM
8 PM 

get the `hot` 5 for the day and send one of them (do not send a duplicate)

make sure they are all images, otherwise use `after` to make more requests to get 5 images.

pick the hottest one off the stack and go from there.