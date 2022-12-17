const { Tweet, User, Reply, Like, sequelize } = require('../models')
const helpers = require('../_helpers')
const { dateFormat } = require('../helpers/date-helper')

const tweetController = {
  // 新增推文：
  postTweet: (req, res, next) => {
    const { description } = req.body
    if (!description) throw new Error('Description is required!')
    return Tweet.create({
      UserId: helpers.getUser(req).id,
      description
    })
      .then(newTweet =>
        res.json(newTweet)
      )
      .catch(err => next(err))
  },
  // 取得所有推文：
  getTweets: (req, res, next) => {
    return Tweet.findAll({
      include: [
        User,
        { model: Reply, include: User }
      ],
      attributes: {
        exclude: ['password'],
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM tweets WHERE tweets.UserId = user.id )'), 'tweetCount'],
          [sequelize.literal('(SELECT COUNT(*) FROM followships WHERE followships.followingId = user.id )'), 'followersCount'],
          [sequelize.literal('(SELECT COUNT(*) FROM followships WHERE followships.followerId = user.id )'), 'followingCount']
        ]
      }
    })
      .then(tweets => {
        return tweets
          .map(tweet => ({
            ...tweet.dataValues,
            // [ 修 ]：發文過一週？是的話顯示日期，不是的話顯示多久之前
            relativeTime: dateFormat(tweet.dataValues.createdAt).fromNow()
            // 計算 reply 該推文的回覆數
            // repliedCount: tweet.replies.length
            // 計算 like 該推文的人數
            // likedCount: tweet.likes.length
            // isLiked(boolean)
          }))
      })
      .then(tweets =>
        res.json(tweets)
      )
      .catch(err => next(err))
  },
  // 取得一則推文：
  getTweet: (req, res, next) => {
    Tweet.findByPk(req.params.tweet_id, {
      include: [
        User,
        { model: Reply, include: User }
      ]
    })
      .then(tweet => {
        if (!tweet) {
          const err = new Error("Tweet didn't exist!")
          err.status = 404
          throw err
        }
        const treetJSON = tweet.toJSON()
        const treetNew = {
          ...treetJSON,
          exactTime: dateFormat(tweet.dataValues.createdAt).format('A hh:mm YYYY年 MMM DD日')
        }
        return res.json(
          treetNew
          // 計算 reply 該推文的回覆數
          // repliedCount: tweet.replies.length
          // 計算 like 該推文的人數
          // likedCount: tweet.likes.length
        )
      })
      .catch(err => next(err))
  },
  // 將推文加入喜歡
  addLike: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    const TweetId = req.params.id
    return Promise.all([
      Tweet.findByPk(TweetId),
      Like.findOne({
        where: {
          UserId: currentUser.id,
          TweetId
        }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        const likeJson = like.toJSON()
        if (likeJson.UserId === currentUser.id) throw new Error('不能按自己的推文讚!')
        if (like) throw new Error('You have liked this tweet!')
        return Like.create({
          UserId: currentUser.id,
          TweetId
        })
      })
      .then(newLike =>
        res.json(newLike)
      )
      .catch(err => next(err))
  },
  // 將推文移除喜歡
  removeLike: (req, res, next) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this tweet")

        return like.destroy()
      })
      .then(newUnlike => res.json(newUnlike))
      .catch(err => next(err))
  }
}

module.exports = tweetController
