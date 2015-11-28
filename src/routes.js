import express from 'express'
import github from 'bugbot-github-issues'
import jwt from 'jsonwebtoken'
import slack from './slack'

let router = express.Router()

function index(req, res) {
  res.render('index')
}

// github oauth callback
function auth(req, res) {
  // exchange the code for a token
  github.token(req.query.code, (err, gh)=> {
    // parse response
    let jwt_token    = jwt.verify(req.query.state, process.env.SECRET)
    let user_id      = jwt_token.user_id
    let team_id      = jwt_token.team_id
    let github_token = gh.access_token
    
    // find the account in the system
    slack.find({user_id, team_id}, (err, account)=> {
      // if it exists (or not) write stuff to account obj
      account.user_id = user_id
      account.team_id = team_id
      account.github_token = github_token
      // save the token to the slack account
      slack.save(account, (err, account)=> {
        let ok = err === null
        let msg = ok? 'Github authorized' : 'Failed to authorize Github'
        res.render('index', {ok, msg})
      })
    })
  })  
}
    
// register the routes
router.get('/', index)
router.get('/bugbot/github/auth', auth)

export default router