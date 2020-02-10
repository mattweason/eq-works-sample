import React from "react";
import _ from 'underscore';
import GoogleMapReact  from 'google-map-react';
import MarkerClusterer from '@google/markerclusterer';
import MapCircle from './MapCircle'
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import './Map.css'

let metricProps = ['impressions', 'clicks', 'revenue'];
let metricPropsColors = ['255,0,0','0,255,0','0,0,255'];
let maxRadius = 100; //Max circle radius for poi metrics on map
let metricRatios = {}; //For relating data value to circle size on the map

let googleMapsRef = '';
let googleMapRef = '';
let markerCluster = '';


class POIMap extends React.Component {
    static defaultProps = {
        center: {
            lat: 43.6532,
            lng: -79.3832
        },
        zoom: 13,
        otherOptions: {
            minZoom: 5,
            maxZoom: 16
        }
    };

    constructor(props) {
        super(props);

        this.state = {
            metrics: '', //All metrics bundled by poi
            mapCircleElements: '', //Bundle of map circle html elements for metric properties
            metricsBool: {
                impressions: false,
                clicks: false,
                revenue: false,
                events: true
            } //Determines whether or not a metric is displayed on the map
        }
    }

    componentDidMount() {
        const script = document.createElement('script')
        script.src = 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js'
        script.async = true
        document.body.appendChild(script)

        this.packageMetrics(); //Once component is mounted aggregate metrics for the map circles
    }

    handleApiLoaded (map, maps) {
        //Cache map and maps objects
        googleMapsRef = maps;
        googleMapRef = map;

        this.renderEventMarkers()
    }

    handleCheckbox = metric => event =>{
        //Cache current metricsBool state
        let metricsBoolCopy = JSON.parse(JSON.stringify(this.state.metricsBool))
        //Make changes to metric
        metricsBoolCopy[metric] = event.target.checked

        //Update changed state while keeping unchanged states the same
        this.setState({
            metricsBool:metricsBoolCopy
        }, () => {
            //Clear or add walk-in event markers
            if(metric === 'events')
                this.renderEventMarkers();
        })

    }

    renderEventMarkers(){

        if(this.state.metricsBool.events){
            let locations = this.getEventMarkers()
            let markers = locations && locations.map((location) => {
                return new googleMapsRef.Marker({position: location})
            })

            markerCluster = new MarkerClusterer(googleMapRef, markers, {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                gridSize: 10,
                minimumClusterSize: 2
            })
        } else {
            markerCluster.clearMarkers();
        }


    }

    getEventMarkers(){
        let locations = [];

            for(let i = 0; i < this.props.data.length; i++){
                let item = this.props.data[i];

                if(item.events > 0)
                    locations.push({lat: item.lat, lng: item.lng})
            }

        return locations;
    }

    packageMetrics(){
        let metrics = {};

        for(let i = 0; i < this.props.data.length; i++){
            let item = this.props.data[i];

            if(metrics.hasOwnProperty(item.name)){
                for(let c = 0; c < metricProps.length; c++)
                    metrics[item.name][metricProps[c]] += item[metricProps[c]];
            }
            else{
                metrics[item.name] = {
                    lat: item.lat,
                    lng: item.lng
                };
                for(let c = 0; c < metricProps.length; c++)
                    metrics[item.name][metricProps[c]]= item[metricProps[c]];
            }
        }

        this.setState({ metrics: metrics }, () => {
            this.bundleMapCircleElements(); //Once we have the data, bundle into map friendly react elements
        });
    }

    bundleMapCircleElements(){
        this.calculateMetricRatios();
        let mapCircleElements = {};

        for(let i = 0; i < metricProps.length; i++){
            mapCircleElements[metricProps[i]] = [];
        }
        for(let place in this.state.metrics){
            let entry = this.state.metrics[place];
            for(let i = 0; i < metricProps.length; i++){
                mapCircleElements[metricProps[i]].push(<MapCircle key={place} lat={entry.lat} lng={entry.lng} color={metricPropsColors[i]} size={this.calculateCircleSize(entry[metricProps[i]], metricProps[i])} />)
            }
        }

        this.setState({ mapCircleElements: mapCircleElements });
    }


    calculateMetricRatios(){
        for(let i = 0; i < metricProps.length; i++){
            let metricMax = _.max(_.pluck(this.state.metrics, metricProps[i]));

            metricRatios[metricProps[i]] = metricMax / (Math.PI * Math.pow(maxRadius, 2)); //Create scale for current metric property based on max circle radius
        }
    }

    calculateCircleSize(value, metricProp){ //Determine map circle size for metric props using scale determined in calculateMetricRatios()
        let diameter = Math.sqrt(value/(Math.PI * metricRatios[metricProp])) * 2;

        return diameter;
    }

    renderMapCircles(metricProp){
        return this.state.mapCircleElements[metricProp];
    }

    render() {
        return (
            <div className="flex-row">
                <div className="map-wrapper">
                    <GoogleMapReact
                        bootstrapURLKeys={{key: `AIzaSyAIWKGtCqVn94mx_Kpw9jIR97nJB15xvgM`}}
                        yesIWantToUseGoogleMapApiInternals
                        onGoogleApiLoaded={({map, maps}) => this.handleApiLoaded(map, maps)}
                        defaultCenter={this.props.center}
                        defaultZoom={this.props.zoom}
                        options={this.props.otherOptions}
                    >
                        { this.state.metricsBool.impressions ? this.renderMapCircles('impressions') : null }
                        { this.state.metricsBool.clicks ? this.renderMapCircles('clicks') : null }
                        { this.state.metricsBool.revenue ? this.renderMapCircles('revenue') : null }
                    </GoogleMapReact>
                </div>
                <div className="checkbox-wrapper">
                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Checkbox checked={this.state.metricsBool.impressions} onChange={this.handleCheckbox('impressions')} value="impressions" />
                            }
                            label="Impressions"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox checked={this.state.metricsBool.clicks} onChange={this.handleCheckbox('clicks')} value="clicks" />
                            }
                            label="Clicks"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox checked={this.state.metricsBool.revenue} onChange={this.handleCheckbox('revenue')} value="revenue" />
                            }
                            label="Revenue"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox checked={this.state.metricsBool.events} onChange={this.handleCheckbox('events')} value="events" />
                            }
                            label="Walk-In Events"
                        />
                    </FormGroup>
                </div>
            </div>
        );
    }
}

export default POIMap;