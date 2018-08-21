// const fs = require("fs-extra")
const Koa = require('koa'),
    App = new Koa(),
    Router = require("koa-router")()

const session = require('koa-generic-session'),
    redisStore = require('koa-redis'),
    Redis = require('redis'),
    client = Redis.createClient(6379, "127.0.0.1");

const Port = 3133;

App.keys = ['keys', 'keykeys'];
const axios = require('axios')
const options = { client: client, db: 1 };
const store = redisStore(options)


App.use(session({
    store
}));


Router.get('/', async (ctx, next) => {
    ctx.body = '000'
})

// 微信消息推送服务器配置
Router.get('/weChat', async (ctx, next) => {
    console.log(ctx.query.echostr)
    ctx.body = ctx.query.echostr
})
// 通过微信登录传入的code，请求 opened
Router.get('/onLogin', async (ctx, next) => {
    console.log(`https://api.weixin.qq.com/sns/jscode2session?appid=wxf413d32e3c964784&secret=3ce186c4da38a0d256fff08ddf766927&js_code=${ctx.query.code}&grant_type=authorization_code`)
    let res = await axios.post(`https://api.weixin.qq.com/sns/jscode2session?appid=wxf413d32e3c964784&secret=3ce186c4da38a0d256fff08ddf766927&js_code=${ctx.query.code}&grant_type=authorization_code`)
    console.log('>>>>>>', res, 'res')
    ctx.body = 'res'
})


// 获取 access_token数据，优先从redis获取，若不存在，则通过微信获取，并存入redis，加入失效时间
async function get() {
    let session = this.session;
    session.count = session.count || 0;
    session.count++;


    let b = await store.client.get("getAccessToken")

    if (!b) {
        let bsb = await axios.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxf413d32e3c964784&secret=3ce186c4da38a0d256fff08ddf766927');
        console.log(bsb.data, 'bsb')
        store.client.set("getAccessToken", bsb.data.access_token)//bsb.data.message)
        store.client.EXPIRE("getAccessToken", bsb.data.expires_in)//bsb.data.expires_in
        return { body: bsb.data.access_token, count: session.count }
    }
    return { body: b, count: session.count }

}

function remove() {
    this.session = null;
    this.body = 0;
}

App.use(Router.routes())

App.use(async (ctx, next) => {
    switch (ctx.path) {
        case '/getWCToken':
            let ad = await get.call(ctx)
            console.log(ad)

            ctx.body = ad
            break;

        case '/remove':
            remove.call(this);
            break;

    }
})
console.log('监听端口号：', Port)
App.listen(Port);

