/* Compiled by kdc on Thu Aug 29 2013 20:21:15 GMT+0000 (UTC) */
(function() {
/* KDAPP STARTS */
/* BLOCK STARTS: /home/alexiss/Applications/Guard.kdapp/index.coffee */
var GuardApp, ProjectsViewItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

GuardApp = (function(_super) {
  __extends(GuardApp, _super);

  function GuardApp() {
    var _this = this;
    GuardApp.__super__.constructor.apply(this, arguments);
    this.kite = KD.getSingleton("kiteController");
    this.info = new KDView({
      cssClass: "information-box",
      partial: "<p>Guard will scan your home directory for files named &quot;Guardfile&quot; and list it below.\nThen you can start <a href=\"https://github.com/guard/guard\">guard</a> application for each of them</p>\n<p>Waring! RVM is not supported yet. Use native ruby or rbenv.</p>"
    });
    this.projects = new KDListViewController({
      startWithLazyLoader: true,
      viewOptions: {
        cssClass: "projects",
        itemClass: ProjectsViewItem
      }
    });
    this.projectsView = this.projects.getView();
    this.projects.getListView().on('StartGuard', function(project) {
      var index, path, _ref;
      if (project.terminal) {
        project.terminal.destroy();
        project.webterm.destroy();
        project.webterm = null;
        project.remote = null;
        return project.terminal = null;
      } else {
        _ref = project.getData(), path = _ref.path, index = _ref.index;
        project.terminal = new KDView({
          cssClass: "terminal"
        });
        project.terminal.$().css({
          width: "100%",
          height: 300
        });
        project.webterm = new WebTermView({
          delegate: project.terminal,
          cssClass: "webterm"
        });
        project.webterm.on("WebTermConnected", function(remote) {
          var cmd, guard_dir;
          project.remote = remote;
          guard_dir = "/tmp/guard/" + index;
          cmd = "mkdir -p " + guard_dir;
          cmd += " && cp " + path + "/Guardfile " + guard_dir + "/Guardfile";
          cmd += " && touch " + guard_dir + "/exchange";
          cmd += " && stat -c %Y " + guard_dir + "/exchange";
          return _this.kite.run(cmd, function(err, response) {
            if (!err) {
              remote.input("cd " + path + "\n");
              remote.input("echo 'notification :file, path: \"" + guard_dir + "/exchange\"' >> " + guard_dir + "/Guardfile\n");
              remote.input("bundle exec guard -G " + guard_dir + "/Guardfile\n");
              if (response) {
                project.watch = parseInt(response.trim());
                return _this.watch(project);
              }
            }
          });
        });
        project.terminal.addSubView(project.webterm);
        return project.addSubView(project.terminal);
      }
    });
  }

  GuardApp.prototype.watch = function(project) {
    var index,
      _this = this;
    if (!(project && project.terminal)) {
      return;
    }
    index = project.getData().index;
    return this.kite.run("stat -c %Y /tmp/guard/" + index + "/exchange", function(err, response) {
      var stat;
      if (err) {
        return;
      }
      setTimeout(function() {
        return _this.watch(project);
      }, 5000);
      stat = parseInt(response.trim());
      if (project.watch !== stat) {
        project.watch = stat;
        return _this.kite.run("cat /tmp/guard/" + index + "/exchange", function(cat_err, cat_response) {
          var cssClass, html, lines, m;
          if (cat_err) {
            return;
          }
          lines = cat_response.trim().split("\n");
          cssClass = 'notify-header';
          if (lines[1].match(/^RSpec\s+/)) {
            if (lines[0] === 'success') {
              cssClass += ' notify-success';
              if (m = lines[2].match(/^(\d+)\s+examples,\s+(\d+)\s+failures/)) {
                if (parseInt(m[1]) > 0) {
                  lines[2] = "<span class=\"notify-success\">" + m[1] + "</span> examples, ";
                } else {
                  lines[2] = "" + m[1] + " examples, ";
                }
                if (parseInt(m[2]) > 0) {
                  lines[2] += "<span class=\"notify-failed\">" + m[2] + "</span> failures";
                } else {
                  lines[2] += "" + m[2] + " failures";
                }
              }
            } else if (lines[0] === 'failed') {
              cssClass += ' notify-failed';
              if (m = lines[2].match(/^(\d+)\s+examples,\s+(\d+)\s+failures/)) {
                if (parseInt(m[1]) > 0) {
                  lines[2] = "<span class=\"notify-success\">" + m[1] + "</span> examples, ";
                } else {
                  lines[2] = "" + m[1] + " examples, ";
                }
                if (parseInt(m[2]) > 0) {
                  lines[2] += "<span class=\"notify-failed\">" + m[2] + "</span> failures";
                } else {
                  lines[2] += "" + m[2] + " failures";
                }
              }
            }
          }
          html = "<p class=\"" + cssClass + "\">" + lines[0] + "</p>";
          if (!lines[1].match(/^RSpec\s+/)) {
            html += "<p>" + lines[1] + "</p>";
          }
          html += "<p>" + lines[2] + "</p>";
          return new KDNotificationView({
            duration: 10000,
            type: 'growl',
            partial: html
          });
        });
      }
    });
  };

  GuardApp.prototype.viewAppended = function() {
    var _this = this;
    GuardApp.__super__.viewAppended.apply(this, arguments);
    return this.kite.run('rm -rf /tmp/guard && mkdir -p /tmp/guard && find $HOME -type f -name Guardfile', function(err, response) {
      var i, path, _i, _len, _ref, _results;
      _this.projects.hideLazyLoader();
      _ref = response.split("\n");
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        path = _ref[i];
        if (path) {
          _results.push(_this.projects.addItem({
            path: path.split('/').slice(0, -1).join('/'),
            name: path.split('/').slice(-2)[0],
            index: i
          }));
        }
      }
      return _results;
    });
  };

  GuardApp.prototype.pistachio = function() {
    return "{{> this.info}}\n{{> this.projectsView}}";
  };

  return GuardApp;

})(JView);

ProjectsViewItem = (function(_super) {
  __extends(ProjectsViewItem, _super);

  function ProjectsViewItem() {
    var _this = this;
    ProjectsViewItem.__super__.constructor.apply(this, arguments);
    this.guardButton = new KDOnOffSwitch({
      callback: function() {
        return _this.getDelegate().emit("StartGuard", _this);
      }
    });
  }

  ProjectsViewItem.prototype.viewAppended = function() {
    this.setTemplate(this.pistachio());
    return this.template.update();
  };

  ProjectsViewItem.prototype.pistachio = function() {
    var name, path, _ref;
    _ref = this.getData(), path = _ref.path, name = _ref.name;
    return "{{> this.guardButton}}\n<div class=\"item-body\">\n  <strong>" + name + ":</strong>\n  " + path + "\n</div>";
  };

  return ProjectsViewItem;

})(KDListItemView);

(function() {
  var appInstance;
  appInstance = new GuardApp;
  return appView.addSubView(appInstance);
})();

/* KDAPP ENDS */
}).call();