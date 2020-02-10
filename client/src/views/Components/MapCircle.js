import React from 'react';
import './MapCircle.css';

const MapCircle = (props) => {
    const { size, color } = props;
    return (
        <div className="map-circle"
             style={{ backgroundColor: 'rgba('+color+',0.5)', width: size+'px', height: size+'px', borderRadius: size/2+'px', border: '1px solid rgb('+color+')'}}
        />
    );
};

export default MapCircle;