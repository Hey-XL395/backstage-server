const router = require('koa-router')()
const Dynamic = require("../model/dynamic")
const Calendar = require('../model/Calendar')
const multer = require('koa-multer')
const User = require('../model/User')
// 首页测试
router.get('/', async (ctx, next) => {
  // await ctx.render('index', {
  //   title: 'Hello Koa 2!'
  // })
  let flag = true
  if (flag) {
    ctx.body = {
      code:200,
      msg:"success",
      body:{
        name:"jack",
        age:18
      }
    }
  }else {
    ctx.body = {
      code:500,
      msg:"error",
      body:null
    }
  }
}),
    // 首页测试
router.get("/city",(ctx,next)=>{
  let flag = true
  if (flag) {
    ctx.body = {
      code:200,
      msg:"success",
      body:{
        name:"jack",
        age:18
      }
    }
  }else {
    ctx.body = {
      code:500,
      msg:"error",
      body:null
    }
  }
}),
// 发送短信验证码
router.post('/sendMsg', async ctx => {
  let {phone} = ctx.request.body
  let code = ('000000' + Math.floor(Math.random() * 999999)).slice(-6)
  let options = {
    url: 'http://apis.haoservice.com/sms/sendv2',
    qs: {
      mobile: phone,
      tpl_id: telId,
      content: `【小爱后台】您的验证码为${code}（小爱注册验证码），请在20分钟内完成注册。如非本人操作，请忽略。`,
      key: apiKey
    }
  }
  try {
    let res = rp(options)
    if (res) {
      // ctx.session.sms = code
      ctx.body = {
        code: 200,
        msg: '短信发送成功',
        data: code
      }
    }
  } catch (e) {
    console.log(e)
  }
})
//获取图形验证码
router.get('/captcha',async ctx =>{
  const cap = svgCaptcha.create({
    size: 4, // 验证码长度
    width:160,
    height:60,
    fontSize: 50,
    ignoreChars: '0oO1ilI', // 验证码字符中排除 0o1i
    noise: 2, // 干扰线条的数量
    color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
    background: '#eee' // 验证码图片背景颜色
  })
  let img = cap.data // 验证码
  let text = cap.text.toLowerCase() // 验证码字符，忽略大小写
  ctx.type = 'html'
  ctx.body = `${img}<br><a href="javascript: window.location.reload();">${text}</a>`
  console.log(ctx.body);
})
// 发布动态
router.post('/addDynamic', async ctx => {
  let newDynamic = new Dynamic(ctx.request.body)
  let res = await newDynamic.save()
  if (res) {
    ctx.body = {
      code: 200,
      msg: '添加动态成功',
      data: newDynamic
    }
  } else {
    ctx.body = {
      code: 500,
      msg: '添加动态失败',
      data: null
    }
  }
})

// 获取动态
router.get('/getDynamic', async ctx => {
  let res = await Dynamic.find()
  if (res.length > 0) {
    ctx.body = {
      code: 200,
      msg: 'success',
      data: res
    }
  } else {
    ctx.body = {
      code: 500,
      msg: '暂无数据',
      data: null
    }
  }
})
//加载koa-multer模块
//文件上传
//配置
let storage = multer.diskStorage({
    //文件保存路径
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    //修改文件名称
    filename: function (req, file, cb) {
        let fileFormat = (file.originalname).split(".");
        cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
})
//加载配置
let upload = multer({storage: storage});
//路由
// router.post('/upload',upload.single('file'),async ctx =>{
//     let {id,url} = ctx.request.body;
//     let res = await User.findByIdAndUpdate(id,{
//         avatar: url
//     });
//     if (res){
//         ctx.body = {
//             code:200,
//             msg:"上传成功",
//         data:res
//         }
//     } else {
//         ctx.body = {
//             code:500,
//             msg:"上传失败",
//             data:null
//         }
//     }
// })
router.post('/upload', upload.single('file'), async (ctx, next) => {
    let id = ctx.session.user._id
    let path = ctx.req.file.path
    path = path.replace('public', '')
    let url = `${ctx.origin}${path}`
    let res = await User.findByIdAndUpdate(id, {
        avatar: url
    })
    if (res) {
        ctx.body = {
            filename: ctx.req.file.filename,
            path: ctx.req.file.path,//返回文件名
            url: `${ctx.origin}${path}`
        }
    }
})
// 获取日程
router.get('/calendar', async ctx => {
    let res = await Calendar.find()
    if (res.length > 0) {
        ctx.body = {
            code: 200,
            msg: 'success',
            data: res
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '暂无日程',
            data: null
        }
    }
})

// 添加日程
router.post('/calendar', async ctx => {
    let newSchedule = new Calendar(ctx.request.body)
    let res = await newSchedule.save()
    if (res) {
        ctx.body = {
            code: 200,
            msg: '添加日程成功',
            data: newSchedule
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '添加日程失败',
            data: null
        }
    }
})

// 删除日程
router.post('/delCalendar', async ctx => {
    let id = ctx.request.body.id
    let res = await Calendar.findByIdAndRemove(id)
    if (res) {
        ctx.body = {
            code: 200,
            msg: '删除成功'
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '删除失败'
        }
    }
})
module.exports = router
