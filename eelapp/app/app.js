class Main extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      hasPath: false,
      hasError: false,
      isWaiting: false,
      recentPaths: [],
      path: '',
      data: [],
      dataCount: 0,
      loveCount: 0,
      ignoreCount: 0,
    }

    this.updatePathOnChange = this.updatePathOnChange.bind(this)
    this.scanPathOnClick = this.scanPathOnClick.bind(this)
    this.clearPathOnClick = this.clearPathOnClick.bind(this)
    this.updateData = this.updateData.bind(this)
    this.deleteIgnoreFiles = this.deleteIgnoreFiles.bind(this)
    this.deleteNotLove = this.deleteNotLove.bind(this)
  }

  async componentWillMount() {
    if (this.state.recentPaths.length > 0) return
    let config = await eel.loadconfigfile()()
    this.setState({
      recentPaths: config['recentPaths'],
    })
  }

  updatePathOnChange(e) {
    this.setState({
      path: e.target.value,
    })
  }

  async getPathData(path) {
    // Read the saved file for previously scanned paths
    let savedData = await eel.loadpathfile(path)()

    // Scan the path for new data
    let allowMedia = [
      '*.gif',
      '*.jpg',
      '*.jpeg',
      '*.png',
      '*.bmp',
      '*.webm',
      '*.mp4',
    ]
    let files = await eel.get_files_dirs(path, allowMedia)()
    files = files[0] // First element from the tuple result are the files, seconds dirs

    if (files.length > 0) {
      // We need to copy the files in the app folder to render
      // them because of chrome safety rules :/
      let localPath = await eel.copytree(path, allowMedia)()
      let localFiles = await eel.get_files_dirs(localPath, allowMedia)()
      localFiles = localFiles[0]

      // Create a data node for each file
      let scannedData = localFiles.map(async (i, index) => ({
        id: await eel.flatname(i, true)(),
        file: files[index],
        appFile: i.split('\\eelapp').pop(), // Path relative to Eel app
        text: '',
        love: false,
        ignore: false,
      }))

      await Promise.all(scannedData).then(
        (promisedData) => (scannedData = promisedData),
      )

      // Extract the unique files from the saved + the scanned
      let filesKnown = []
      let mergeData = savedData.concat(scannedData).reduce((list, i) => {
        if (filesKnown.indexOf(i.file) === -1) {
          filesKnown.push(i.file)
          list.push(i)
        }
        return list
      }, [])

      return mergeData
    }
  }

  async scanPathOnClick(e) {
    this.setState({ isWaiting: true })

    let pathData = await this.getPathData(this.state.path)
    if (pathData && pathData.length > 0) {
      // Recent paths to the top
      let recentPaths = this.state.recentPaths
      let pathRecentIndex = recentPaths.indexOf(this.state.path)

      if (pathRecentIndex === -1) {
        recentPaths = [this.state.path, ...recentPaths]
      } else {
        recentPaths.splice(pathRecentIndex, 1) // Remove
        recentPaths = [this.state.path, ...recentPaths]
      }

      this.setState({
        recentPaths: recentPaths,
      })

      // Save them
      await eel.saveconfigfile({
        recentPaths: recentPaths,
      })()

      // Divide them
      let normalData = pathData.filter((i) => !i.ignore && !i.love)
      let ignoreData = pathData.filter((i) => i.ignore)
      let loveData = pathData.filter((i) => i.love)

      this.setState({
        hasPath: true,
        hasError: false,
        isWaiting: false,
        data: pathData,
        dataCount: normalData.length,
        loveCount: loveData.length,
        ignoreCount: ignoreData.length,
      })

      await eel.savepathfile(this.state.path, pathData)()
    } else {
      this.setState({
        hasError: 'No files found!',
        isWaiting: false,
      })

      setTimeout(
        function () {
          this.setState({ hasError: false })
        }.bind(this),
        1500,
      )
    }
  }

  clearPathOnClick(e) {
    this.setState({
      hasPath: false,
    })
  }

  async updateData(newData) {
    // Divide
    let normalData = newData.filter((i) => !i.ignore && !i.love)
    let ignoreData = newData.filter((i) => i.ignore)
    let loveData = newData.filter((i) => i.love)

    this.setState({
      data: newData,
      dataCount: normalData.length,
      loveCount: loveData.length,
      ignoreCount: ignoreData.length,
    })

    // Files
    await eel.savepathfile(this.state.path, newData)()
    await eel.saveqbotfile(this.state.path)()
  }

  async deleteIgnoreFiles() {
    let toDelete = this.state.data.filter((i) => i.ignore).map((i) => i.file)
    await eel.deletefiles(toDelete)()

    let newData = this.state.data.filter((i) => !i.ignore)
    this.updateData(newData)
  }

  async deleteNotLove() {
    let toDelete = this.state.data.filter((i) => !i.love).map((i) => i.file)
    await eel.deletefiles(toDelete)()

    let newData = this.state.data.filter((i) => i.love)
    this.updateData(newData)
  }

  renderPathInput() {
    return (
      <PathInput
        recentPaths={this.state.recentPaths}
        path={this.state.path}
        updatePath={this.updatePathOnChange}
        scanPath={this.scanPathOnClick}
        error={this.state.hasError}
        isWaiting={this.state.isWaiting}
      />
    )
  }

  renderPosts() {
    return (
      <MediaCollection
        data={this.state.data}
        dataCount={this.state.dataCount}
        loveCount={this.state.loveCount}
        ignoreCount={this.state.ignoreCount}
        updateData={this.updateData}
        deleteIgnoreFiles={this.deleteIgnoreFiles}
        deleteNotLove={this.deleteNotLove}
        clearPath={this.clearPathOnClick}
      />
    )
  }

  render() {
    if (this.state.hasPath) {
      return this.renderPosts()
    } else {
      return this.renderPathInput()
    }
  }
}

ReactDOM.render(<Main />, document.getElementById('root'))
