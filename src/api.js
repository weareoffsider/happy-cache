var HappyCache = function(options) {
  options = options || {}
  var VERSION_REGEX = options.versionRegex || /Version ([\d\.]+)/g
  var VERSION_KEY = options.versionKey || "cacheVersion"

  if (!options.loadApp && !options.resources) {
    throw new Error("loadApp function or resources option required")
  }


  var saveVersion = function() {
    var req = new XMLHttpRequest()
    req.onload = function(e) {
      var appVersion = VERSION_REGEX.exec(req.responseText)[1]
      localStorage.setItem(VERSION_KEY, appVersion)
    }

    req.open("GET", options.cacheLocation, true)
    req.send()
  }


  var versionCheck = function() {
    var req = new XMLHttpRequest()
    req.onload = function(e) {
      var appVersion = VERSION_REGEX.exec(req.responseText)[1]
      var current = localStorage.getItem(VERSION_KEY)
      
      if (current == null || current != appVersion) {
        var updateIframe = document.createElement("iframe")
        updateIframe.className = options.updaterClassName
        updateIframe.src = options.updaterLocation
        document.body.appendChild(updateIframe)
      }
    }
    req.open("GET", options.cacheLocation, true)
    req.send()
  }


  var doLoad = function(event) {
    if (options.resources) {
      options.resources.forEach(function(resource) {
        var elem

        if (resource.slice(-3) == "css") {
          elem = document.createElement("link")
          elem.rel = "stylesheet"
          elem.href = resource
        } else {
          elem = document.createElement("link")
          elem.src = resource
        }

        document.body.appendChild(elem)
      })
    }

    if (options.loadApp) options.loadApp(event)
  }

  window.applicationCache.addEventListener('noupdate', doLoad)
  window.applicationCache.addEventListener('error', doLoad)
  window.applicationCache.addEventListener('updateready', function(e) {
    if (options.reloadMethod == "swapCache") {
      window.applicationCache.swapCache()
      if (options.isomorphic) saveVersion()
      doLoad(e)
    } else if (options.isomorphic) {
      saveVersion()
    } else {
      window.location.reload()
    }
  })

  window.applicationCache.addEventListener('cached', function(e) {
    doLoad(e)
    if (options.isomorphic) saveVersion()
  })

  window.applicationCache.addEventListener('progress', function(e) {
  })

  if (options.isomorphic) {
    setTimeout(function() {
      if (window.applicationCache.status == window.applicationCache.UNCACHED) {
        doLoad({type: "noop"})
        checkVersion()
      }
    }, 0)
  }
}

module.exports = HappyCache
