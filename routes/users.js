const router = require('koa-router')()
const User = require("../model/User")
router.prefix('/users')
const {tokenSecret, telId, apiKey,clientId,clientSecret,scope} = require('../config')
const rp = require('request-promise')
const svgCaptcha = require('svg-captcha')//验证码
const nodemailer  = require("nodemailer");
const fetch = require("node-fetch")
// 注册
router.post('/register', async ctx => {
  let {username, password,code,mail,phone} = ctx.request.body //前端的所有参数
    let sms = ctx.session.sms
  let user = await User.findOne({
    username
  })
    if(user){
        ctx.body ={
            code:500,
            msg:"用户名已存在",
            data:null
        }
    }else {
        if (code !== sms ){
            ctx.body ={
                code:500,
                msg:"验证码错误",
                data:null
            }
        }else if ( code === sms ) {
            let newUser = new User({
                username,
                password,
                mail,
                phone
            })
            let res = await newUser.save()
            if (res){
                ctx.body = {
                    code:200,
                    msg:"注册成功",
                    data:res
                }
            } else {
                ctx.body = {
                    code:500,
                    msg:"注册失败"
                }
            }
        }

    }
})
//配置邮件
router.post('/getpassword',async ctx =>{
    let {username,mail} =ctx.request.body
    console.log(ctx.request.body);
    let user = await User.findOne({
        username,
        mail
    })
    if (user){
        const transporter = nodemailer.createTransport({
            host : 'smtp.qq.com',
            secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
            auth : {
                user : '271305636@qq.com', //发送邮件的邮箱
                pass : 'luujvlawjgdebhfa' //第三方授权密码，POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
            },
        });
//发送邮件
        let sendmail = function(html){
            let option = {
                from:"271305636@qq.com",//发送邮件的邮箱
                to:mail, //目标邮箱,多个邮箱用逗号隔开
                subject : '后台管理系统',
                text : '找回密码',
            }
            // 方法2
            // let res = await  transporter.sendMail(option)
            // if (res){
            //     ctx.body = {
            //         code: 200,
            //         msg: '请查看邮件',
            //         data: user
            //     }
            // }
            option.html= html;
            transporter.sendMail(option, function(error, response){
                if(error){
                    console.log("fail: " + error);
                }else{
                    console.log("success: "+ response.message);
                }
            });
        }
        sendmail (`${user.username}你好，你的密码是${user.password}`);
        ctx.body = {
            code: 200,
            msg: '请查看邮件',
            data: user
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '用户名或邮箱错误',
            data: null
        }
    }
})
// 删除用户
router.post('/deleteUser', async ctx => {
    let {id} = ctx.request.body
    let res = await User.findByIdAndRemove(id)
    if (res) {
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: null
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '删除失败',
            data: null
        }
    }
})

// 获取全部用户
router.get('/allUser', async ctx => {
    let users = await User.find()
    if (users.length > 0) {
        ctx.body = {
            code: 200,
            msg: 'success',
            data: users
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '暂无用户',
            data: null
        }
    }
})

// 登录
router.post('/login', async ctx => {
    let captchatext = ctx.session.captchatext
    let {username, password,Verification} = ctx.request.body
    let user = await User.findOne({
        username,
        password
    })
    if (user) {
        console.log(Verification);
        console.log(captchatext);
        if (Verification !== captchatext){
            ctx.body = {
                code: 500,
                msg: '验证码错误',
                data: null
            }
        } else if (Verification === captchatext) {
            ctx.session.user = user
            // let token = jwt.sign({username: username}, tokenSecret, {expiresIn: '1h'})
            ctx.body = {
                code: 200,
                msg: '登录成功',
                data: {
                    user,
                    // token
                }
            }
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '用户名或密码不正确',
            data: null
        }
    }
})

// 退出登录
router.get('/logout', async ctx => {
    // ctx.session.user = null
    ctx.body = {
        code: 200,
        msg: '退出成功',
        data: null
    }
})
// 修改密码
router.post("/updatePwd", async ctx => {
    let { username, password, id, newPwd } = ctx.request.body;
    let user = await User.findOne({
        username,
        password
    });
    if (user) {
        if (password === newPwd) {
            ctx.body = {
                code: 500,
                msg: "新密码不能与原密码相同"
            };
        } else {
            let res = await User.findByIdAndUpdate(id, {
                username,
                password: newPwd
            });
            if (res) {
                ctx.body = {
                    code: 200,
                    msg: "修改成功"
                };
            } else {
                ctx.body = {
                    code: 500,
                    msg: "修改失败"
                };
            }
        }
    } else {
        ctx.body = {
            code: 500,
            msg: "原密码不正确,请重新输入"
        };
    }
});

//获取图形验证码
router.get('/captcha',async ctx =>{
    const cap = svgCaptcha.create({
        size: 4, // 验证码长度
        width:160,
        height:60,
        fontSize: 50,
        ignoreChars: '0oO1ilI', // 验证码字符中排除 0o1i
        noise: 3, // 干扰线条的数量
        color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
        background: '#eee' // 验证码图片背景颜色
    })
    let img = cap.data // 验证码
    let text = cap.text.toLowerCase() // 验证码字符，忽略大小写
    ctx.session.captchatext = text
    console.log(ctx.session.captchatext);
    ctx.type = 'html'
    ctx.body = `${img}<br>`
})
// 修改用户
router.post('/updateUser', async ctx => {
    let {id, newPwd} = ctx.request.body
    let res = await User.findByIdAndUpdate(id, {
        password: newPwd
    })
    if (res) {
        ctx.body = {
            code: 200,
            msg: '修改成功',
            data: null
        }
    } else {
        ctx.body = {
            code: 500,
            msg: '修改失败',
            data: null
        }
    }
})

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
            ctx.session.sms = code
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
// github登录
router
  .get("/githubLogin", async ctx => {
    let dataStr = new Date().valueOf();
    //重定向到认证接口,并配置参数
    let path = "https://github.com/login/oauth/authorize";
    path += "?client_id=" + clientId;
    path += "&scope=" + scope;
    path += "&state=" + dataStr;
    //转发到授权服务器
    ctx.redirect(path);
	console.log(path)
  })
  .get("/auth", async ctx => {
    const code = ctx.query.code;
    let path = "https://github.com/login/oauth/access_token";
    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    };
    await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    })
      .then(res => {
        return res.text();
      })
      .then(body => {
        const args = body.split("&");
        let arg = args[0].split("=");
        const access_token = arg[1];
        return access_token;
      })
      .then(async token => {
        const url = " https://api.github.com/user?access_token=" + token;
        await fetch(url)
          .then(res => {
            return res.json();
          })
          .then(res => {
            ctx.session.githubUser = res;
            ctx.redirect(`http://localhost:8080`);
          });
      })
      .catch(e => {
        console.log(e);
      });
  });

// 获取github登录的用户
router.get("/githubUser", async ctx => {
  if (ctx.session.githubUser) {
    ctx.body = {
      code: 200,
      msg: "success",
      data: ctx.session.githubUser
    };
  }else{
      ctx.body = {
          code: 500,
          msg: "error",
          data: null
      };
  }
});
module.exports = router
