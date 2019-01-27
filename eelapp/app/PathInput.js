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
		let recentPaths = this.props.recentPaths.map((i) => {
			return (
				<p>
					<a onClick={(e) => this.changePathOnClick(e, i)}>{i}</a>
				</p>
			);
		});

		let buttonClass = 'button';
		let buttonText = '';

		if (this.props.error) {
			buttonClass = 'button is-danger';
			buttonText = this.props.error;
		} else if (this.props.waiting) {
			buttonClass = 'button is-warning is-loading';
		}

		return (
			<section className="hero is-fullheight">
				<div className="hero-body">
					<div className="container">
						<nav className="level">
							<div className="level-item">
								<input
									ref={(input) => (this.pathInput = input)}
									autoFocus
									className="input"
									type="text"
									placeholder="Paste your path here and click 'Scan'"
									value={this.props.path}
									onChange={this.props.updatePath}
									onKeyDown={this.scanOnKeyDown}
								/>
								<a className={buttonClass} onClick={this.props.scanPath}>
									<span className="icon">
										<img src="/app/img/search.svg" alt="Scan" />
									</span>
									{buttonText ? <span>{buttonText}</span> : null}
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
