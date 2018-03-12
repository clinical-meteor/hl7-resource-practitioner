import Avatar from 'material-ui/Avatar';
import React from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin from 'react-mixin';
import { Table } from 'react-bootstrap';
import { get } from 'lodash';
import { Glass } from 'meteor/clinical:glass-ui';

Session.setDefault('selectedPractitioner', false);

export class PractitionersTable extends React.Component {
  parsePractitioner(practitioner){
    let result = {
      _id: practitioner._id,
      name: '',
      telecomValue: '',
      telecomUse: '',
      qualificationId: '',
      qualificationStart: '',
      qualificationEnd: '',
      issuer: ''
    };

    // fhir-1.6.0
    if (practitioner.name && practitioner.name[0]) {
      if(practitioner.name[0].text){
        result.name = practitioner.name[0].text;
      } else {
        result.name = practitioner.name[0].given[0] + ' ' + practitioner.name[0].family[0];
      } 
    } else {
    // fhir-1.0.2
      result.name = practitioner.name.text;        
    }

    if (get(practitioner, 'telecom[0].value')) {
      result.telecomValue = get(practitioner, 'telecom[0].value');
    }
    if (get(practitioner, 'telecom[0].use') ) {
      result.telecomUse = get(practitioner, 'telecom[0].use')
    }

    if (practitioner.qualification && practitioner.qualification[0] && practitioner.qualification[0].identifier && practitioner.qualification[0].identifier[0] && practitioner.qualification[0].identifier[0].value ) {
      result.qualificationId = practitioner.qualification[0].identifier[0].value;
    }
    if (practitioner.qualification && practitioner.qualification[0] && practitioner.qualification[0].identifier && practitioner.qualification[0].identifier[0] && practitioner.qualification[0].identifier[0].period && practitioner.qualification[0].identifier[0].period.start ) {
      result.qualificationStart = moment(practitioner.qualification[0].identifier[0].period.start).format("MMM YYYY");
    }
    if (practitioner.qualification && practitioner.qualification[0] && practitioner.qualification[0].identifier && practitioner.qualification[0].identifier[0] && practitioner.qualification[0].identifier[0].period && practitioner.qualification[0].identifier[0].period.end) {
      result.qualificationEnd = moment(practitioner.qualification[0].identifier[0].period.end).format("MMM YYYY");
    }
    if (practitioner.qualification && practitioner.qualification[0] && practitioner.qualification[0].issuer && practitioner.qualification[0].issuer.display ) {
      result.issuer = practitioner.qualification[0].issuer.display;
    }
    return result;
  }
  getMeteorData() {
    var self = this;

    let data = {
      style: {
        row: Glass.darkroom({
          opacity: Session.get('globalOpacity')
        })
      },
      selected: [],
      practitioners: []
    };

    let query = {};
    let options = {};
    if (get(Meteor, 'settings.public.defaults.paginationLimit')) {
      options.limit = get(Meteor, 'settings.public.defaults.paginationLimit');
    }

    if(this.props.data){
      //console.log('this.props.data', this.props.data)
      data.practitioners = this.props.data.map(function(practitioner){
        return self.parsePractitioner(practitioner);
      });
    } else {
      data.practitioners = Practitioners.find(query, options).map(function(practitioner){
        return self.parsePractitioner(practitioner);
      });
    }
    process.env.DEBUG && console.log("PractitionersTable[data]", data);
    return data;
  }

  rowClick(id){
    Session.set('practitionerUpsert', false);
    Session.set('selectedPractitioner', id);
    Session.set('practitionerPageTabIndex', 2);
  }
  render () {
    let tableRows = [];
    //console.log('this.data.practitioners', this.data.practitioners)
    for (var i = 0; i < this.data.practitioners.length; i++) {
      tableRows.push(
      <tr className='practitionerRow' key={i} style={this.data.style.row} onClick={ this.rowClick.bind('this', this.data.practitioners[i]._id) }>
        <td className="name">{this.data.practitioners[i].name}</td>
        <td className="telecomValue">{this.data.practitioners[i].telecomValue}</td>
        <td className="telecomUse">{this.data.practitioners[i].telecomUse}</td>
        <td className="issuer">{this.data.practitioners[i].issuer}</td>
        <td className="qualificationId">{this.data.practitioners[i].qualificationId}</td>
        <td className="qualificationStart">{this.data.practitioners[i].qualificationStart}</td>
        <td className="qualificationEnd">{this.data.practitioners[i].qualificationEnd}</td>
        {/*<td className="barcode">{this.data.practitioners[i]._id}</td>*/}
      </tr>);
    }


    return(
      <Table id="practitionersTable" hover >
        <thead>
          <tr>
            <th className="name">name</th>
            <th className="telecomValue">telecom</th>
            <th className="telecomUse">use</th>
            <th className="issuer">issuer</th>
            <th className="qualificationId">identification</th>
            <th className="qualificationStart">start</th>
            <th className="qualificationEnd">end</th>
            {/*<th className="barcode">_id</th>*/}
          </tr>
        </thead>
        <tbody>
          { tableRows }
        </tbody>
      </Table>

    );
  }
}

ReactMixin(PractitionersTable.prototype, ReactMeteorData);
export default PractitionersTable;