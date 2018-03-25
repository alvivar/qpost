class PathInput extends React.Component {
  constructor(props) {
    super(props);

    this.scanOnKeyDown = this.scanOnKeyDown.bind(this);
    this.changePathOnClick = this.changePathOnClick.bind(this);
  }

  scanOnKeyDown(e) {
    // Enter
    if (e.keyCode === 10 || e.keyCode === 13) {
      this.props.scanPath(e);
    }
  }

  changePathOnClick(e, path) {
    e.target.value = path;
    this.props.updatePath(e);
    this.pathInput.focus();
  }

  render() {
    let recentPaths = this.props.recentPaths.map(i => {
      return (
        <p>
          <a onClick={e => this.changePathOnClick(e, i)}>{i}</a>
        </p>
      );
    });

    let buttonClass = "button is-primary";
    let buttonText = "Scan";

    if (this.props.error) {
      buttonClass = "button is-danger";
      buttonText = this.props.error;
    } else if (this.props.waiting) {
      buttonClass = "button is-info is-loading";
    }

    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container">
            <nav className="level">
              <div className="level-item">
                <input
                  ref={input => (this.pathInput = input)}
                  autoFocus
                  className="input"
                  type="text"
                  placeholder="Paste your path here and click 'Scan'"
                  value={this.props.path}
                  onChange={this.props.updatePath}
                  onKeyDown={this.scanOnKeyDown}
                />
                <a className={buttonClass} onClick={this.props.scanPath}>
                  {buttonText}
                </a>
              </div>
            </nav>
            {recentPaths}
          </div>
        </div>
      </section>
    );
  }
}

class Post extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      value: props.value
    };

    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.updateValueOnChange = this.updateValueOnChange.bind(this);
    this.saveData = this.saveData.bind(this);
    this.saveOnKeyDown = this.saveOnKeyDown.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== nextProps.value) {
      this.setState({ value: nextProps.value });
    }
  }

  toggleEditMode() {
    this.setState({
      editMode: !this.state.editMode
    });
  }

  updateValueOnChange(e) {
    this.setState({
      value: e.target.value
    });
  }

  saveData() {
    let id = this.props.id;
    let value = this.state.value;
    let newData = [...this.props.data, ...this.props.ignoreData].map(i => {
      if (i.id === id) i.text = value;
      return i;
    });

    this.props.updateData(newData);
    this.toggleEditMode();
  }

  saveOnKeyDown(e) {
    // Ctrl + Enter
    if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey) {
      this.saveData();
    }
  }

  renderShow() {
    return (
      <div>
        <span onClick={this.toggleEditMode}>
          {this.state.value.trim() ? (
            this.state.value
          ) : (
            <p className="help">(Click to edit description)</p>
          )}
        </span>
      </div>
    );
  }

  renderEdit() {
    return (
      <div>
        <textarea
          autoFocus
          className="textarea"
          value={this.state.value}
          onChange={this.updateValueOnChange}
          onKeyDown={this.saveOnKeyDown}
        />
        <br />
        <a className="button is-primary" onClick={this.saveData}>
          Save
        </a>
      </div>
    );
  }

  render() {
    if (!this.state.editMode) {
      return this.renderShow();
    } else {
      return this.renderEdit();
    }
  }
}

class PostsCollection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showLove: false,
      showIgnore: false
    };

    this.cardsRef = [];
    this.lastRandomCards = [];

    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
    this.toggleLove = this.toggleLove.bind(this);
    this.toggleIgnore = this.toggleIgnore.bind(this);
    this.toggleShowLove = this.toggleShowLove.bind(this);
    this.toggleShowIgnore = this.toggleShowIgnore.bind(this);
    this.showNormal = this.showNormal.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  componentWillUpdate() {
    this.cardsRef = []; // New cards refs every render
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyboard);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyboard);
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  handleKeyboard(e) {
    let cards = this.cardsRef.filter(i => i !== null);
    let count = cards.length;
    if (count < 1) return;

    // Sort by closest to the scroll
    let scrollTop = document.documentElement.scrollTop;
    let cardsVisible = this.filterVisible(cards);
    cardsVisible.sort((a, b) => {
      return (
        Math.abs(scrollTop - a.offsetTop) - Math.abs(scrollTop - b.offsetTop)
      );
    });
    let currentCard = cardsVisible[0];

    if (e.keyCode === 78) {
      // 'n' goes to a random image card
      let random = this.randomInt(0, count - 1);
      while (this.lastRandomCards.indexOf(random) !== -1)
        random = this.randomInt(0, count - 1);
      this.lastRandomCards.push(random);

      while (this.lastRandomCards.length > count / 5 * 4)
        this.lastRandomCards.splice(0, 1);

      window.scrollTo(0, cards[random].offsetTop);
    } else if (e.keyCode === 74) {
      // 'j' goes to the next image
      let currentIndex = cards.indexOf(currentCard);
      let nextCard = cards[currentIndex + 1];
      if (nextCard !== void 0) window.scrollTo(0, nextCard.offsetTop);
      else window.scrollTo(0, currentCard.offsetTop);
    } else if (e.keyCode === 75) {
      // 'k' goes to the previous image
      let currentIndex = cards.indexOf(currentCard);
      let nextCard = cards[currentIndex - 1];
      if (nextCard !== void 0) window.scrollTo(0, nextCard.offsetTop);
      else window.scrollTo(0, currentCard.offsetTop);
    } else if (e.keyCode === 76) {
      // 'l' love toggle the image
      this.toggleLove(currentCard.id, null, currentCard.offsetTop);
    } else if (e.keyCode === 73) {
      // 'i' ignore toggle the image
      this.toggleIgnore(currentCard.id, null, currentCard.offsetTop);
    }
  }

  isScrolledIntoView(el) {
    let rect = el.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = rect.bottom;

    // Only completely visible elements return true:
    let isVisible = elemTop >= 0 && elemBottom <= window.innerHeight;
    // Partially visible elements return true:
    isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
  }

  filterVisible(elements) {
    return elements.reduce((list, i) => {
      if (i === null) return list;

      let index = list.indexOf(i);
      if (!this.isScrolledIntoView(i)) {
        if (index !== -1) {
          list.splice(index, 1);
        }
      } else {
        if (index === -1) {
          list.unshift(i);
        }
      }

      return list;
    }, []);
  }

  getBrothersIds(id, data) {
    let idIndex = data.findIndex(i => i.id === id);
    let upId = data[idIndex - 1] !== void 0 ? data[idIndex - 1].id : false;
    let downId = data[idIndex + 1] !== void 0 ? data[idIndex + 1].id : false;

    return {
      up: upId,
      down: downId
    };
  }

  moveUp(id, e) {
    // Scroll to the start of the current element
    window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

    // Find
    let allData = [...this.props.data, ...this.props.ignoreData];
    let idIndex = allData.findIndex(i => i.id === id);

    // Love is a special case
    if (this.state.showLove) {
      let ids = this.getBrothersIds(id, allData.filter(i => i.love));
      if (ids.up) {
        // Extract
        let value = allData[idIndex];
        allData.splice(idIndex, 1); // Remove

        // Insert
        let upIndex = allData.findIndex(i => i.id === ids.up);
        allData.splice(upIndex, 0, value);
      }

      return this.props.updateData(allData);
    }

    // Move
    let value = allData[idIndex];
    allData.splice(idIndex, 1); // Remove
    idIndex = idIndex > 0 ? idIndex - 1 : 0; // Up
    allData.splice(idIndex, 0, value); // Insert

    this.props.updateData(allData);
  }

  moveDown(id, e) {
    // Scroll to the start of the current element
    window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

    // Find
    let allData = [...this.props.data, ...this.props.ignoreData];
    let idIndex = allData.findIndex(i => i.id === id);

    // Love is a special case
    if (this.state.showLove) {
      let ids = this.getBrothersIds(id, allData.filter(i => i.love));
      if (ids.down) {
        // Extract
        let value = allData[idIndex];
        allData.splice(idIndex, 1); // Remove

        // Insert
        let upIndex = allData.findIndex(i => i.id === ids.down);
        allData.splice(upIndex + 1, 0, value);
      }

      return this.props.updateData(allData);
    }

    // Move
    let value = allData[idIndex];
    allData.splice(idIndex, 1); // Remove
    idIndex = idIndex + 1; // Down
    allData.splice(idIndex, 0, value); // Insert

    this.props.updateData(allData);
  }

  toggleLove(id, e, offsetTop = false) {
    let scrollOffset = offsetTop
      ? offsetTop
      : e.target.parentElement.parentElement.offsetTop;

    // Toggle love
    let allData = [...this.props.data, ...this.props.ignoreData];
    let newData = allData.map(i => {
      if (i.id === id) {
        i.love = !i.love;
        if (this.state.showLove && !i.love)
          // Scroll to the start of the element on unlove
          window.scrollTo(0, scrollOffset);
      }
      return i;
    });

    this.props.updateData(newData);
  }

  toggleIgnore(id, e, offsetTop = false) {
    // Scroll to the start of the current element
    let scrollOffset = offsetTop
      ? offsetTop
      : e.target.parentElement.parentElement.offsetTop;
    window.scrollTo(0, scrollOffset);

    // Toggle ignore
    let allData = [...this.props.data, ...this.props.ignoreData];
    let newData = allData.map(i => {
      if (i.id === id) i.ignore = !i.ignore;
      return i;
    });

    this.props.updateData(newData);
  }

  toggleShowLove() {
    if (this.state.showLove) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonLove.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showLove: true,
          showIgnore: false
        });
      }.bind(this),
      10
    );
  }

  toggleShowIgnore() {
    if (this.state.showIgnore) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonIgnore.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showIgnore: true,
          showLove: false
        });
      }.bind(this),
      10
    );
  }

  showNormal() {
    if (!this.state.showLove && !this.state.showIgnore) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonNormal.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showLove: false,
          showIgnore: false
        });
      }.bind(this),
      10
    );
  }

  render() {
    // Data filtering
    let chosenData = [];
    if (this.state.showIgnore) chosenData = this.props.ignoreData;
    else {
      if (this.state.showLove)
        chosenData = [...this.props.data, ...this.props.ignoreData];
      else chosenData = this.props.data;
    }

    if (this.state.showLove) chosenData = chosenData.filter(i => i.love);

    // Entry generation
    let posts = chosenData.map(data => {
      let buttonLoveText = "Love";
      let buttonLoveClass = "button card-footer-item";
      if (data.love) buttonLoveClass = "button is-danger card-footer-item";

      let buttonIgnoreText = "Ignore";
      let buttonIgnoreClass = "";
      if (data.ignore) buttonIgnoreText = "Add again";

      return (
        <div>
          <div
            className="card"
            ref={card => this.cardsRef.push(card)}
            id={data.id}
          >
            <div className="card-image">
              <figure className="image">
                <img src={data.appFile} />
              </figure>
            </div>
            <div className="card-content">
              <div className="content">
                <Post
                  id={data.id}
                  value={data.text}
                  data={this.props.data}
                  ignoreData={this.props.ignoreData}
                  updateData={this.props.updateData}
                />
              </div>
            </div>
            <footer className="card-footer">
              <a
                onClick={e => this.toggleLove(data.id, e)}
                className={buttonLoveClass}
              >
                {buttonLoveText}
              </a>
              <a
                onClick={e => this.moveUp(data.id, e)}
                className="button card-footer-item"
              >
                Up
              </a>
              <a
                onClick={e => this.moveDown(data.id, e)}
                className="button card-footer-item"
              >
                Down
              </a>
              <a
                onClick={e => this.toggleIgnore(data.id, e)}
                className="button card-footer-item"
              >
                {buttonIgnoreText}
              </a>
            </footer>
          </div>
          <hr />
        </div>
      );
    });

    let buttonNormalText = `${this.props.dataCount} Main`;
    let buttonNormalClass = "button";
    if (!this.state.showLove && !this.state.showIgnore)
      buttonNormalClass = "button is-warning";

    let buttonLoveText = `${this.props.loveCount} Love`;
    let buttonLoveClass = "button";
    if (this.state.showLove) buttonLoveClass = "button is-warning";

    let buttonIgnoreText = `${this.props.ignoreCount} Ignored`;
    let buttonIgnoreClass = "button";
    if (this.state.showIgnore) buttonIgnoreClass = "button is-warning";

    return (
      <section className="section">
        <nav className="level navbar is-fixed-top">
          <div className="level-item">
            <a className="button" onClick={this.props.clearPath}>
              Home
            </a>
            <a
              ref={i => (this.buttonNormal = i)}
              className={buttonNormalClass}
              onClick={this.showNormal}
            >
              {buttonNormalText}
            </a>
            <a
              ref={i => (this.buttonLove = i)}
              className={buttonLoveClass}
              onClick={this.toggleShowLove}
            >
              {buttonLoveText}
            </a>
            <a
              ref={i => (this.buttonIgnore = i)}
              className={buttonIgnoreClass}
              onClick={this.toggleShowIgnore}
            >
              {buttonIgnoreText}
            </a>
          </div>
        </nav>
        <div className="container">
          <br />
          <div>{posts}</div>
        </div>
      </section>
    );
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasPath: false,
      hasError: false,
      isWaiting: false,
      recentPaths: [],
      path: "",
      data: [],
      ignoreData: [],
      dataCount: 0,
      loveCount: 0,
      ignoreCount: 0
    };

    this.updatePathOnChange = this.updatePathOnChange.bind(this);
    this.scanPathOnClick = this.scanPathOnClick.bind(this);
    this.clearPathOnClick = this.clearPathOnClick.bind(this);
    this.updateData = this.updateData.bind(this);
  }

  async componentWillMount() {
    if (this.state.recentPaths.length > 0) return;

    let config = await eel.loadconfigfile()();
    this.setState({
      recentPaths: config["recentPaths"]
    });
  }

  updatePathOnChange(e) {
    this.setState({
      path: e.target.value
    });
  }

  async getPathData(path) {
    // Read the saved file for previously scanned paths
    let savedData = await eel.loadpathfile(path)();

    // Scan the path for new data
    let allow = ["*.gif", "*.jpg", "*.png"]; // Only images
    let files = await eel.get_files_dirs(path, allow)();
    files = files[0]; // First element from the tuple result are the files, seconds dirs

    if (files.length > 0) {
      // We need to copy the files in the app folder to render
      // them because of chrome safety rules :/
      let localPath = await eel.copytree(path, allow)();
      let localFiles = await eel.get_files_dirs(localPath, allow)();
      localFiles = localFiles[0];

      // Create a data node for each file
      let scannedData = localFiles.map(async (i, index) => ({
        id: await eel.flatname(i, true)(),
        file: files[index],
        appFile: i.split("\\eeldata").pop(), // Path relative to Eel app
        text: "",
        love: false,
        ignore: false
      }));

      await Promise.all(scannedData).then(
        promisedData => (scannedData = promisedData)
      );

      // The difference between the scan and the saved data is the new data
      let oldData = [];
      let newData = [];
      scannedData.forEach(i => {
        let iSaved = savedData.filter(j => j.id === i.id);
        if (iSaved.length > 0) oldData.push(iSaved[0]);
        else newData.push(i);
      });

      return savedData.concat(newData);
    }
  }

  async scanPathOnClick(e) {
    this.setState({ isWaiting: true });

    let pathData = await this.getPathData(this.state.path);
    if (pathData && pathData.length > 0) {
      // Recent paths to the top
      let recentPaths = this.state.recentPaths;
      let pathRecentIndex = recentPaths.indexOf(this.state.path);

      if (pathRecentIndex === -1) {
        recentPaths = [this.state.path, ...recentPaths];
      } else {
        recentPaths.splice(pathRecentIndex, 1); // Remove
        recentPaths = [this.state.path, ...recentPaths];
      }

      this.setState({
        recentPaths: recentPaths
      });

      // Save them
      await eel.saveconfigfile({
        recentPaths: recentPaths
      })();

      // Divide them
      let normalData = [];
      let ignoreData = [];
      pathData.forEach(i => {
        if (i.ignore) ignoreData.push(i);
        else normalData.push(i);
      });
      let loveData = [...normalData, ...ignoreData].filter(i => i.love);

      this.setState({
        hasPath: true,
        hasError: false,
        isWaiting: false,
        data: normalData,
        ignoreData: ignoreData,
        dataCount: normalData.length,
        loveCount: loveData.length,
        ignoreCount: ignoreData.length
      });

      await eel.savepathfile(this.state.path, pathData)();
    } else {
      this.setState({
        hasError: "No files found!",
        isWaiting: false
      });

      setTimeout(
        function() {
          this.setState({ hasError: false });
        }.bind(this),
        2000
      );
    }
  }

  clearPathOnClick(e) {
    this.setState({
      hasPath: false
    });
  }

  async updateData(newData) {
    // Divide
    let normalData = [];
    let ignoreData = [];
    newData.forEach(i => {
      if (i.ignore) ignoreData.push(i);
      else normalData.push(i);
    });
    let loveData = [...normalData, ...ignoreData].filter(i => i.love);

    this.setState({
      data: normalData,
      ignoreData: ignoreData,
      dataCount: normalData.length,
      loveCount: loveData.length,
      ignoreCount: ignoreData.length
    });

    // Files
    await eel.savepathfile(this.state.path, [...normalData, ...ignoreData])();
    await eel.saveqbotfile(this.state.path)();
  }

  renderPathInput() {
    return (
      <PathInput
        recentPaths={this.state.recentPaths}
        path={this.state.path}
        updatePath={this.updatePathOnChange}
        scanPath={this.scanPathOnClick}
        error={this.state.hasError}
        waiting={this.state.isWaiting}
      />
    );
  }

  renderPosts() {
    return (
      <PostsCollection
        data={this.state.data}
        ignoreData={this.state.ignoreData}
        dataCount={this.state.dataCount}
        loveCount={this.state.loveCount}
        ignoreCount={this.state.ignoreCount}
        updateData={this.updateData}
        clearPath={this.clearPathOnClick}
      />
    );
  }

  render() {
    if (this.state.hasPath) {
      return this.renderPosts();
    } else {
      return this.renderPathInput();
    }
  }
}

ReactDOM.render(<Main />, document.getElementById("root"));
