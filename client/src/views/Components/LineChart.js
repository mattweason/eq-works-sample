import React from "react";
import moment from "moment";
import _ from "underscore";
import { Line } from 'react-chartjs-2';

const lineColors = {
    impressions: '#FF6384',
    clicks: '#4BC0C0',
    revenue: '#FFCE56',
    events: '#E7E9ED'
}

class LineChart extends React.Component {
    constructor(props) {
        super(props);
        this.chartReference = React.createRef();

        this.state = { data: { datasets:[], labels:[] } };
    }

    callAPI() {
        let stats = [];
        let events = [];
        fetch("http://localhost:5555/stats/daily")
            .then(res => res.text())
            .then(res => {
                stats = res;

                return fetch('http://localhost:5555/events/daily'); // make a 2nd request and return a promise
            })
            .then(res => res.text())
            .then(res => {
                events = res;

                this.packageData(JSON.parse(stats), JSON.parse(events));
            })
            .catch(err => err);
    }

    componentDidMount() {
        this.callAPI();
    }

    packageData(stats, events) {
        let data = _.map(stats, (element) => {
            let item = _.findWhere(events, { date: element.date });

            return _.extend(element, item);
        });

        let labels = _.pluck(data, "date");
        for(let i = 0; i < labels.length; i++){
            labels[i] = moment(labels[i]).format('dddd');
        }

        let datasets = [];

        console.log(this.props.metrics)
        const keys = Object.keys(data[0]);
        const metrics = _.filter(keys, _.partial(_.contains, this.props.metrics))
        console.log(metrics)

        for (let i = 0; i < metrics.length; i++) { //Skip 'date' which is first key
            console.log(lineColors[metrics[i]])
            const dataset = {
                label: metrics[i],
                fill: false,
                lineTension: 0.1,
                backgroundColor: lineColors[metrics[i]],
                borderColor: lineColors[metrics[i]],
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: lineColors[metrics[i]],
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: lineColors[metrics[i]],
                pointHoverBorderColor: 'rgba(220,220,220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data:  _.pluck(data, metrics[i])
            };
            datasets.push(dataset);
        }

        this.setState({ data: { datasets: datasets, labels: labels }})
    }

    render() {
        return (
            <Line ref={this.chartReference} data={this.state.data} />
            )
    }
}

export default LineChart