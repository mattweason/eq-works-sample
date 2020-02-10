import React from 'react';
import './MapCircle.css';

const MapCircle = (props) => {
    const { size, color, metricValue, metricProp } = props;
    return (
        <div className="map-circle"
             style={{ backgroundColor: 'rgba('+color+',0.5)', width: size+'px', height: size+'px', borderRadius: size/2+'px', border: '1px solid rgb('+color+')'}}
        >
            <div className="value" style={{left: size+'px', top: (size/2)-10+'px'}}>{metricProp}: {metricValue}</div>
        </div>
    );
};

export default MapCircle;