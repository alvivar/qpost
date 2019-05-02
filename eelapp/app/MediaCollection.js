class MediaCollection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showLove: false,
            showIgnore: false
        };

        this.cardsRef = [];
        this.lastRandomCards = [];
        this.ignoreShortcuts = false;

        this.moveUp = this.moveUp.bind(this);
        this.moveDown = this.moveDown.bind(this);
        this.toggleLove = this.toggleLove.bind(this);
        this.toggleIgnore = this.toggleIgnore.bind(this);
        this.toggleShowLove = this.toggleShowLove.bind(this);
        this.toggleShowIgnore = this.toggleShowIgnore.bind(this);
        this.showNormal = this.showNormal.bind(this);
        this.deleteIgnoreFiles = this.deleteIgnoreFiles.bind(this);
        this.deleteNotLove = this.deleteNotLove.bind(this);
        this.setIgnoreShortcuts = this.setIgnoreShortcuts.bind(this);
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

    setIgnoreShortcuts(value) {
        if (this.ignoreShortcuts != value) this.ignoreShortcuts = value;
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    autoWidthToView(el, step = 8, padding = 40, maxTries = 1024) {
        if (!this.isInsideView(el)) return;

        step = step <= 0 ? 1 : step;
        let width = el.offsetWidth;

        let loopLimit = maxTries;
        while (loopLimit-- > 0 && !this.isInsideView(el, false)) {
            width -= step;
            el.style.width = width + "px";
        }

        loopLimit = maxTries;
        while (loopLimit-- > 0 && this.isInsideView(el, false)) {
            width += step;
            el.style.width = width + "px";
        }

        width -= padding;
        el.style.width = width + "px";
    }

    handleKeyboard(e) {
        if (this.ignoreShortcuts) return;

        let cards = this.cardsRef.filter(i => i !== null);
        let count = cards.length;
        if (count < 1) return;

        // Sort by closest to the scroll
        let scrollTop = document.documentElement.scrollTop;
        let cardsVisible = this.filterVisible(cards);
        cardsVisible.sort(
            (a, b) =>
                Math.abs(scrollTop - a.offsetTop) -
                Math.abs(scrollTop - b.offsetTop)
        );

        let currentCard = cardsVisible[0];

        // If there isn't a visible card, let's go to the last one
        if (!currentCard) {
            let lastCard = cards[cards.length - 1];
            window.scrollTo(0, lastCard.offsetTop);
            this.autoWidthToView(lastCard);
            return;
        }

        let currentIndex = cards.indexOf(currentCard);
        let nextCard = null;

        // Current cards will be ignored when jumping to a random image
        if (this.lastRandomCards.indexOf(currentCard.id) === -1)
            this.lastRandomCards.push(currentCard.id);

        // Limit
        while (this.lastRandomCards.length > count * 0.8)
            this.lastRandomCards.splice(0, 1);

        if (e.keyCode === 78) {
            // 'n' goes to a random image card

            let random = this.randomInt(0, count - 1);
            while (this.lastRandomCards.indexOf(cards[random].id) !== -1)
                random = this.randomInt(0, count - 1);
            this.lastRandomCards.push(cards[random].id);

            nextCard = cards[random];
            window.scrollTo(0, nextCard.offsetTop);
        } else if (e.keyCode === 74) {
            // 'j' goes to the next image

            nextCard = cards[currentIndex + 1];

            if (nextCard !== void 0) {
                window.scrollTo(0, nextCard.offsetTop);
            } else {
                window.scrollTo(0, currentCard.offsetTop);
            }
        } else if (e.keyCode === 75) {
            // 'k' goes to the previous image

            nextCard = cards[currentIndex - 1];

            if (nextCard !== void 0) {
                window.scrollTo(0, nextCard.offsetTop);
            } else {
                window.scrollTo(0, currentCard.offsetTop);
            }
        } else if (e.keyCode === 76) {
            // 'l' love toggle the image
            this.toggleLove(currentCard.id, null, currentCard.offsetTop);
        } else if (e.keyCode === 73) {
            // 'i' ignore toggle the image
            this.toggleIgnore(currentCard.id, null, currentCard.offsetTop);
        }

        // Tech for the chosen card
        if (!nextCard && currentCard) nextCard = currentCard;
        if (nextCard) {
            this.autoWidthToView(nextCard);

            // Autoplay when there is a video
            let videos = nextCard.getElementsByTagName("video");
            if (videos[0]) {
                videos[0].pause();
                videos[0].currentTime = 0;
                // videos[0].load();
                videos[0].play();
            }
        }
    }

    isInsideView(el, partially = true) {
        let rect = el.getBoundingClientRect();
        let elemTop = rect.top;
        let elemBottom = rect.bottom;
        let elemRight = rect.right;

        // Only completely visible elements return true:
        let isVisible =
            elemTop >= 0 &&
            elemBottom <= window.innerHeight &&
            elemRight <= window.innerWidth;

        // Partially visible elements return true:
        if (partially)
            isVisible = elemTop < window.innerHeight && elemBottom >= 0;

        return isVisible;
    }

    filterVisible(elements) {
        return elements.reduce((list, i) => {
            if (i === null) return list;

            let index = list.indexOf(i);
            if (!this.isInsideView(i)) {
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
        let downId =
            data[idIndex + 1] !== void 0 ? data[idIndex + 1].id : false;

        return {
            up: upId,
            down: downId
        };
    }

    moveUp(id, e) {
        // Scroll to the start of the current element
        window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

        // Find
        let allData = [...this.props.data];
        let idIndex = allData.findIndex(i => i.id === id);

        // Images on the current list
        let ids = [];
        if (this.state.showLove) {
            ids = this.getBrothersIds(id, allData.filter(i => i.love));
        } else if (this.state.showIgnore) {
            ids = this.getBrothersIds(id, allData.filter(i => i.ignore));
        } else {
            ids = this.getBrothersIds(id, allData.filter(i => !i.ignore));
        }

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

    moveDown(id, e) {
        // Scroll to the start of the current element
        window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

        // Find
        let allData = [...this.props.data];
        let idIndex = allData.findIndex(i => i.id === id);

        // Images on the current list
        let ids = [];
        if (this.state.showLove) {
            ids = this.getBrothersIds(id, allData.filter(i => i.love));
        } else if (this.state.showIgnore) {
            ids = this.getBrothersIds(id, allData.filter(i => i.ignore));
        } else {
            ids = this.getBrothersIds(id, allData.filter(i => !i.ignore));
        }

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

    toggleLove(id, e, offsetTop = false) {
        let scrollOffset = offsetTop
            ? offsetTop
            : e.target.parentElement.parentElement.offsetTop;

        // Toggle love
        let allData = [...this.props.data];
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
        let allData = [...this.props.data];
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

    deleteIgnoreFiles() {
        this.buttonIgnore.classList.toggle("is-loading");
        this.buttonDelete.classList.toggle("is-loading");

        setTimeout(
            function() {
                this.props.deleteIgnoreFiles();
                this.showNormal();
            }.bind(this),
            10
        );
    }

    deleteNotLove() {
        this.buttonLove.classList.toggle("is-loading");
        this.buttonDeleteNotLove.classList.toggle("is-loading");

        setTimeout(
            function() {
                this.props.deleteNotLove();
                this.showNormal();
            }.bind(this),
            10
        );
    }

    render() {
        // Data filtering
        let chosenData = [];
        if (this.state.showLove) {
            chosenData = this.props.data.filter(i => i.love);
        } else if (this.state.showIgnore) {
            chosenData = this.props.data.filter(i => i.ignore);
        } else {
            chosenData = this.props.data.filter(i => !i.ignore && !i.love);
        }

        // Entry generation
        let posts = chosenData.map(data => {
            let buttonLoveClass = "button card-footer-item";
            if (data.love) buttonLoveClass = "button is-info card-footer-item";

            return (
                <div>
                    <hr />
                    <div
                        className="columns is-mobile is-gapless"
                        ref={card => this.cardsRef.push(card)}
                        id={data.id}
                    >
                        <div className="column">
                            <figure className="image">
                                <MediaFile filename={data.appFile} />
                            </figure>
                        </div>
                        <div className="column" style={{ maxWidth: "40px" }}>
                            <a
                                onClick={e => this.toggleLove(data.id, e)}
                                className={buttonLoveClass}
                            >
                                <img
                                    src="/app/img/heart.svg"
                                    alt="Love"
                                    style={{
                                        maxWidth: "20px",
                                        maxHeight: "20px"
                                    }}
                                />
                            </a>
                            <a
                                onClick={e => this.moveUp(data.id, e)}
                                className="button card-footer-item"
                            >
                                <img
                                    src="/app/img/caret-up.svg"
                                    alt="Up"
                                    style={{
                                        maxWidth: "25px",
                                        maxHeight: "25px"
                                    }}
                                />
                            </a>
                            <a
                                onClick={e => this.moveDown(data.id, e)}
                                className="button card-footer-item"
                            >
                                <img
                                    src="/app/img/caret-down.svg"
                                    alt="Down"
                                    style={{
                                        maxWidth: "25px",
                                        maxHeight: "25px"
                                    }}
                                />
                            </a>
                            <a
                                onClick={e => this.toggleIgnore(data.id, e)}
                                className="button card-footer-item"
                            >
                                <img
                                    src="/app/img/ban.svg"
                                    alt="Ignore"
                                    style={{
                                        maxWidth: "20px",
                                        maxHeight: "20px"
                                    }}
                                />
                            </a>
                        </div>
                    </div>
                    <div className="column">
                        <ImageDescription
                            id={data.id}
                            value={data.text}
                            data={this.props.data}
                            updateData={this.props.updateData}
                            setIgnoreShortcuts={this.setIgnoreShortcuts}
                        />
                    </div>
                    <hr />
                </div>
            );
        });

        let buttonNormalText = `${this.props.dataCount}`;
        let buttonNormalClass = "button";
        if (!this.state.showLove && !this.state.showIgnore)
            buttonNormalClass = "button is-warning";

        let buttonLoveText = `${this.props.loveCount}`;
        let buttonLoveClass = "button";
        if (this.state.showLove) buttonLoveClass = "button is-warning";

        let buttonIgnoreText = `${this.props.ignoreCount}`;
        let buttonIgnoreClass = "button";
        if (this.state.showIgnore) buttonIgnoreClass = "button is-warning";

        let maxIconSize = "25px";

        return (
            <section className="section">
                <nav className="level navbar is-fixed-top">
                    <div className="level-item">
                        <a className="button" onClick={this.props.clearPath}>
                            <span className="icon">
                                <img
                                    src="/app/img/home.svg"
                                    alt="Home"
                                    style={{
                                        maxWidth: maxIconSize,
                                        maxHeight: maxIconSize
                                    }}
                                />
                            </span>
                        </a>
                        <a
                            ref={i => (this.buttonNormal = i)}
                            className={buttonNormalClass}
                            onClick={this.showNormal}
                        >
                            <span className="icon">
                                <img
                                    src="/app/img/images.svg"
                                    alt="Images"
                                    style={{
                                        maxWidth: maxIconSize,
                                        maxHeight: maxIconSize
                                    }}
                                />
                            </span>
                            <span>{buttonNormalText}</span>
                        </a>
                        <a
                            ref={i => (this.buttonLove = i)}
                            className={buttonLoveClass}
                            onClick={this.toggleShowLove}
                        >
                            <span className="icon">
                                <img
                                    src="/app/img/heart.svg"
                                    alt="Love"
                                    style={{
                                        maxWidth: maxIconSize,
                                        maxHeight: maxIconSize
                                    }}
                                />
                            </span>
                            <span>{buttonLoveText}</span>
                        </a>
                        {this.state.showLove ? (
                            <a
                                ref={i => (this.buttonDeleteNotLove = i)}
                                className="button is-info"
                                onClick={this.deleteNotLove}
                            >
                                <span className="icon">
                                    <img
                                        src="/app/img/bolt-solid.svg"
                                        alt="Overwrite"
                                        style={{
                                            maxWidth: maxIconSize,
                                            maxHeight: maxIconSize
                                        }}
                                    />
                                </span>
                            </a>
                        ) : null}
                        <a
                            ref={i => (this.buttonIgnore = i)}
                            className={buttonIgnoreClass}
                            onClick={this.toggleShowIgnore}
                        >
                            <span className="icon">
                                <img
                                    src="/app/img/ban.svg"
                                    alt="Ignore"
                                    style={{
                                        maxWidth: maxIconSize,
                                        maxHeight: maxIconSize
                                    }}
                                />
                            </span>
                            <span>{buttonIgnoreText}</span>
                        </a>
                        {this.state.showIgnore ? (
                            <a
                                ref={i => (this.buttonDelete = i)}
                                className="button is-danger"
                                onClick={this.deleteIgnoreFiles}
                            >
                                <span className="icon">
                                    <img
                                        src="/app/img/trash-alt.svg"
                                        alt="Delete"
                                        style={{
                                            maxWidth: maxIconSize,
                                            maxHeight: maxIconSize
                                        }}
                                    />
                                </span>
                            </a>
                        ) : null}
                    </div>
                </nav>
                <div className="container">
                    <div>{posts}</div>
                </div>
            </section>
        );
    }
}
