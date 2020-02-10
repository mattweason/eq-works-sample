import React from "react";
import "./App.css";
import LineChart from "./views/Components/LineChart"
import SimpleMap from "./views/Components/Map";
import TableContainer from "./views/Components/Table";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = { poiStatsDaily: "" };
    }

    callAPI() {
        fetch("http://localhost:5555/poi-stats/daily")
            .then(res => res.text())
            .then(res => {
                this.setState({poiStatsDaily: JSON.parse(res)})

            })
            .catch(err => err);
    }

    componentDidMount() {
        this.callAPI();
    }

    render() {
        return (
            <div className="App">
                <div className="card">
                    <h2>Impressions/Clicks vs Revenue/Walk-in Events</h2>
                    <div className="chart-container">
                        <div className="line-chart">
                            <LineChart metrics={['impressions', 'clicks']} />
                        </div>
                        <div className="line-chart">
                            <LineChart metrics={['revenue', 'events']} />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <h2>POI Map</h2>
                    <div className="card-content">
                        <div className="map-frame">
                            { this.state.poiStatsDaily ? <SimpleMap data={this.state.poiStatsDaily} /> : null }
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="table-frame">
                        <h2>POI Stats by Day</h2>
                        <div className="card-content">
                            { this.state.poiStatsDaily ? <TableContainer data={this.state.poiStatsDaily} /> : null }
                        </div>
                    </div>
                </div>
            </div>
    );
    }
}

export default App;
