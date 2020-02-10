import React from "react";
import moment from "moment";
import { MDBDataTable } from 'mdbreact';

export default class TableContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = { tableData: { columns: [], rows: [] } }
    }

    componentDidMount(){
        this.packageData(this.props.data)
    }

    packageData(data){
        //Determine columns
        let columns= [];
        let keys = Object.keys(data[0]);

        for(let i = 0; i < keys.length; i++){
            columns.push({
                label: keys[i].toUpperCase(),
                field: keys[i],
                sort: 'asc'
            });
        }

        //Format date
        for(let i = 0; i < data.length; i++){
            data[i].date = moment(data[i].date).format('ll');
        }

        this.setState( {tableData: {columns: columns, rows: data} })
    }

    render() {
        return (
            <MDBDataTable
                striped
                bordered
                small
                data={this.state.tableData}
            />
        )
    }
}