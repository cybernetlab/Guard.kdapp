##
#
#
class GuardApp extends JView
  constructor:->
    super
    @kite = KD.getSingleton("kiteController")
    @info = new KDView
      cssClass : "information-box"
      partial  : """
        <p>Guard will scan your home directory for files named &quot;Guardfile&quot; and list it below.
        Then you can start <a href="https://github.com/guard/guard">guard</a> application for each of them</p>
        <p> RVM is not supported yet. Use native ruby or rbenv.</p>
      """
    @projects = new KDListViewController
      startWithLazyLoader : yes
      viewOptions         :
        cssClass          : "projects"
        itemClass         : ProjectsViewItem
    @projectsView = @projects.getView()
    @projects.getListView().on 'StartGuard', (project)=>
      if project.terminal
        project.terminal.destroy()
        project.webterm.destroy()
        project.webterm = null
        project.remote = null
        project.terminal = null
      else
        {path, index} = project.getData()
        project.terminal = new KDView
          cssClass: "terminal"
        project.terminal.$().css
          width: "100%"
          height: 300
        project.webterm = new WebTermView
          delegate: project.terminal
          cssClass: "webterm"
        project.webterm.on "WebTermConnected", (remote)=>
          project.remote = remote
          guard_dir = "/tmp/guard/#{index}"
          cmd = "mkdir -p #{guard_dir}"
          cmd += " && cp #{path}/Guardfile #{guard_dir}/Guardfile"
          cmd += " && touch #{guard_dir}/exchange"
          cmd += " && stat -c %Y #{guard_dir}/exchange"
          @kite.run cmd, (err, response)=>
            if !err
              remote.input "cd #{path}\n"
              remote.input "echo 'notification :file, path: \"#{guard_dir}/exchange\"' >> #{guard_dir}/Guardfile\n"
              remote.input "bundle exec guard -G #{guard_dir}/Guardfile\n"
              if response
                project.watch = parseInt(response.trim())
                @watch(project)
        project.terminal.addSubView project.webterm
        project.addSubView project.terminal

  watch:(project)->
    return unless project && project.terminal
    {index} = project.getData()
    @kite.run "stat -c %Y /tmp/guard/#{index}/exchange", (err, response)=>
      return if err
      setTimeout =>
        @watch(project)
      , 5000
      stat = parseInt(response.trim())
      if project.watch != stat
        project.watch = stat
        @kite.run "cat /tmp/guard/#{index}/exchange", (cat_err, cat_response)=>
          return if cat_err
          lines = cat_response.trim().split("\n")
          cssClass = 'notify-header'
          if lines[1].match(/^RSpec\s+/)
            if lines[0] == 'success'
              cssClass += ' notify-success'
              if m = lines[2].match(/^(\d+)\s+examples,\s+(\d+)\s+failures/)
                if parseInt(m[1]) > 0
                  lines[2] = "<span class=\"notify-success\">#{m[1]}</span> examples, "
                else
                  lines[2] = "#{m[1]} examples, "
                if parseInt(m[2]) > 0
                  lines[2] += "<span class=\"notify-failed\">#{m[2]}</span> failures"
                else
                  lines[2] += "#{m[2]} failures"
            else if lines[0] == 'failed'
              cssClass += ' notify-failed'
              if m = lines[2].match(/^(\d+)\s+examples,\s+(\d+)\s+failures/)
                if parseInt(m[1]) > 0
                  lines[2] = "<span class=\"notify-success\">#{m[1]}</span> examples, "
                else
                  lines[2] = "#{m[1]} examples, "
                if parseInt(m[2]) > 0
                  lines[2] += "<span class=\"notify-failed\">#{m[2]}</span> failures"
                else
                  lines[2] += "#{m[2]} failures"
          html = "<p class=\"#{cssClass}\">#{lines[0]}</p>"
          if !lines[1].match(/^RSpec\s+/)
            html += "<p>#{lines[1]}</p>"
          html += "<p>#{lines[2]}</p>"
          new KDNotificationView
            duration: 10000
            type: 'growl'
            partial: html
        
  viewAppended:->
    super
    @kite.run 'rm -rf /tmp/guard && mkdir -p /tmp/guard && find $HOME -type f -name Guardfile | grep -v \\/\\\\\\.', (err, response)=>
      @projects.hideLazyLoader()
      for path, i in response.split("\n") when path
        @projects.addItem {path: path.split('/').slice(0, -1).join('/'), name: path.split('/').slice(-2)[0], index: i}

  pistachio:->
    """
    {{> @info}}
    {{> @projectsView}}
    """

class ProjectsViewItem extends KDListItemView
  constructor:->
    super
    @guardButton = new KDOnOffSwitch
      callback  :=> @getDelegate().emit "StartGuard", @

  viewAppended:->
    @setTemplate @pistachio()
    @template.update()

  pistachio:->
    {path, name} = @getData()
    """
    {{> @guardButton}}
    <div class="item-body">
      <strong>#{name}:</strong>
      #{path}
    </div>
    """

do ->
  appInstance = new GuardApp
  appView.addSubView appInstance
