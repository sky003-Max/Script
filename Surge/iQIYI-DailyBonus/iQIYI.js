/*
爱奇艺会员签到脚本

更新时间: 2020.5.6 23:00
脚本兼容: QuantumultX, Surge4, Loon
电报频道: @NobyDa
问题反馈: @NobyDa_bot

获取Cookie说明：
打开爱奇艺App后(AppStore中国区)，点击"我的", 如通知成功获取cookie, 则可以使用此签到脚本.
获取Cookie后, 您可以手动将主机名移除，以免产生不必要的MITM.
脚本将在每天上午9:00执行, 您可以修改执行时间。

**********************
QuantumultX 脚本配置:
**********************
[task_local]
# 爱奇艺会员签到
# 注意此为本地路径, 请根据实际情况自行调整.
0 9 * * * iQIYI.js

[rewrite_local]
# 获取Cookie
# 注意此为本地路径, 请根据实际情况自行调整.
https?:\/\/.*\.iqiyi\.com\/.*authcookie= url script-request-header iQIYI.js

# MITM = *.iqiyi.com

**********************
Surge4 或 Loon 脚本配置:
**********************
[Script]
# 爱奇艺会员签到
cron "0 9 * * *" script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js

# 获取Cookie
http-request https?:\/\/.*\.iqiyi\.com\/.*authcookie= script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js

# MITM = *.iqiyi.com
*/
var $nobyda = nobyda()
var done = $nobyda.done()
if ($nobyda.isRequest) {
  GetCookie()
} else {
  Checkin()
}

function Checkin() {
  var URL = {
    url: 'https://tc.vip.iqiyi.com/taskCenter/task/queryUserTask?autoSign=yes&P00001=' + $nobyda.read("CookieQY"),
  }
  $nobyda.get(URL, function(error, response, data) {
    if (error) {
      notify = "签到失败: 接口请求出错 ‼️"
      console.log("爱奇艺会员签到失败:\n" + error)
    } else {
      var obj = JSON.parse(data)
      if (obj.msg == "成功") {
        if (obj.data.signInfo.code == "A00000") {
          var AwardName = obj.data.signInfo.data.rewards[0].name;
          var quantity = obj.data.signInfo.data.rewards[0].value;
          var continued = obj.data.signInfo.data.continueSignDaysSum;
          var notify = "签到成功: " + AwardName + quantity + ", 已连签" + continued + "天 🎉"
        } else {
          var notify = "签到失败: " + obj.data.signInfo.msg + " ⚠️"
        }
      } else {
        var notify = "签到失败: Cookie失效 ‼️"
      }
    }
    Lottery(notify)
  })
}

function Lottery(one) {
  var URL = {
    url: 'https://iface2.iqiyi.com/aggregate/3.0/lottery_activity?app_k=0&app_v=0&platform_id=0&dev_os=0&dev_ua=0&net_sts=0&qyid=0&psp_uid=0&psp_cki=' + $nobyda.read("CookieQY") + '&psp_status=0&secure_p=0&secure_v=0&req_sn=0'
  }
  $nobyda.get(URL, function(error, response, data) {
    if (error) {
      one += "\n抽奖失败: 接口请求出错 ‼️"
      console.log("爱奇艺会员抽奖失败:\n" + error)
      $nobyda.notify("爱奇艺", "", one)
    } else {
      var obj = JSON.parse(data);
      if (obj.title && obj.code == 0) {
        one += "\n抽奖成功: " + obj.awardName.replace(/《.+》/, "未中奖") + " 🎉"
      } else if (data.match(/机会用完/)) {
        one += "\n抽奖失败: 今日已转过 ⚠️"
      } else if (data.match(/(未登录|不存在)/)) {
        one += "\n抽奖失败: Cookie失效 ‼️"
      } else {
        one += "\n抽奖错误: 已输出日志 ⚠️"
        console.log("爱奇艺会员抽奖失败:\n" + data)
      }
      if (data.match(/\"daysurpluschance\":\"(1|2)\"/)) {
        Lottery(one)
      } else {
        $nobyda.notify("爱奇艺", "", one)
      }
    }
  })
}

function GetCookie() {
  var regex = /authcookie=([A-Za-z0-9]+)/;
  var iQIYI = regex.exec($request.url)[1];
  if ($nobyda.read("CookieQY")) {
    if ($nobyda.read("CookieQY") != iQIYI) {
      var cookie = $nobyda.write(iQIYI, "CookieQY");
      if (!cookie) {
        $nobyda.notify("更新爱奇艺签到Cookie失败‼️", "", "")
      } else {
        $nobyda.notify("更新爱奇艺签到Cookie成功 🎉", "", "")
      }
    }
  } else {
    var cookie = $nobyda.write(iQIYI, "CookieQY");
    if (!cookie) {
      $nobyda.notify("首次写入爱奇艺Cookie失败‼️", "", "")
    } else {
      $nobyda.notify("首次写入爱奇艺Cookie成功 🎉", "", "")
    }
  }
}

function nobyda() {
  const isRequest = typeof $request != "undefined"
  const isSurge = typeof $httpClient != "undefined"
  const isQuanX = typeof $task != "undefined"
  const notify = (title, subtitle, message) => {
    if (isQuanX) $notify(title, subtitle, message)
    if (isSurge) $notification.post(title, subtitle, message)
  }
  const write = (value, key) => {
    if (isQuanX) return $prefs.setValueForKey(value, key)
    if (isSurge) return $persistentStore.write(value, key)
  }
  const read = (key) => {
    if (isQuanX) return $prefs.valueForKey(key)
    if (isSurge) return $persistentStore.read(key)
  }
  const adapterStatus = (response) => {
    if (response) {
      if (response.status) {
        response["statusCode"] = response.status
      } else if (response.statusCode) {
        response["status"] = response.statusCode
      }
    }
    return response
  }
  const get = (options, callback) => {
    if (isQuanX) {
      if (typeof options == "string") options = {
        url: options
      }
      options["method"] = "GET"
      $task.fetch(options).then(response => {
        callback(null, adapterStatus(response), response.body)
      }, reason => callback(reason.error, null, null))
    }
    if (isSurge) $httpClient.get(options, (error, response, body) => {
      callback(error, adapterStatus(response), body)
    })
  }
  const done = (value = {}) => {
    if (isQuanX) isRequest ? $done(value) : null
    if (isSurge) isRequest ? $done(value) : $done()
  }
  return {
    isRequest,
    notify,
    write,
    read,
    get,
    done
  }
};