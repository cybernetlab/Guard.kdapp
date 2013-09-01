# Guard koding.com application

This is a [koding.com](http://koding.com) application, that wraps original [Guard](http://github.com/guard/guard) command line tool.

# Requirements

* You need [ruby](https://www.ruby-lang.org/) to be installed. To have different ruby versions on same machine you can
  use [rbenv](https://github.com/sstephenson/rbenv) package.
* [Guard](https://github.com/guard/guard) gem shuold be installed. Use `gem install guard` command or include `gem guard`
  line to your `Gemfile`.

> NOTE. Ruby version manager [rvm](http://rvm.io) is not supported.

# Usage

After run, the application will scan your home folder (to see your home folder, run `echo $HOME` command in terminal)
for files, named `Guardfile`. All folders, that contains this file will be listed. Then you can start guard program
for each project, by turning project switch on.

When you turn on project switch, terminal will open and guard program will start in it. So, when you change some files,
defined in Guardfile, guard will run program, specified in Guardfile for this files and result of this execution will
appear as notification.