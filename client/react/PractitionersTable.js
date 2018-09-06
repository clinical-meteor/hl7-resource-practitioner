import Avatar from 'material-ui/Avatar';
import React from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin from 'react-mixin';
import { Table } from 'react-bootstrap';
import { get } from 'lodash';
import { Glass } from 'meteor/clinical:glass-ui';

Session.setDefault('selectedPractitioner', false);


// flattenPractitioner = function(practitioner){
//   let result = {
//     _id: practitioner._id,
//     id: practitioner.id,
//     active: practitioner.active.toString(),
//     gender: get(practitioner, 'gender'),
//     name: '',
//     mrn: '',
//     birthDate: '',
//     photo: "/thumbnail-blank.png",
//     initials: 'abc'
//   };

//   result.birthDate = moment(practitioner.birthDate).format("YYYY-MM-DD")
//   result.photo = get(practitioner, 'photo[0].url', '');
//   result.identifier = get(practitioner, 'identifier[0].value', '');

//   result.maritalStatus = get(practitioner, 'maritalStatus.text', '');
//   result.deceased = get(practitioner, 'deceasedBoolean', '');
//   result.species = get(practitioner, 'animal.species.text', '');
//   result.language = get(practitioner, 'communication[0].language.text', '');

//   let nameText = get(practitioner, 'name[0].text');
//   if(nameText.length > 0){
//     result.name = get(practitioner, 'name[0].text');    
//   } else {
//     if(get(practitioner, 'name[0].suffix[0]')){
//       result.name = get(practitioner, 'name[0].suffix[0]')  + ' ';
//     }

//     result.name = result.name + get(practitioner, 'name[0].given[0]') + ' ' + get(practitioner, 'name[0].family[0]');
    
//     if(get(practitioner, 'name[0].suffix[0]')){
//       result.name = result.name + ' ' + get(practitioner, 'name[0].suffix[0]');
//     }
//   }

//   return result;
// }



export class PractitionersTable extends React.Component {
  flattenPractitioner(practitioner){
    console.log('PractitionersTable.flattenPractitioner()', practitioner)

    let result = {
      _id: practitioner._id,
      name: '',
      phone: '',
      email: '',
      qualificationIssuer: '',
      qualificationIdentifier: '',
      qualificationCode: '',
      qualificationStart: null,
      qualificationEnd: null,
      text: '',
      city: '',
      state: '',
      postalCode: ''
    };

    //---------------------------------------------------------
    // TODO REFACTOR:  HumanName
    // parse name!
    // totally want to extract this
    if(get(practitioner, 'name.text')){
      result.name = get(practitioner, 'name.text');
    } else {
      if(get(practitioner, 'name.suffix[0]')){
        result.name = get(practitioner, 'name.suffix[0]')  + ' ';
      }
  
      result.name = result.name + get(practitioner, 'name.given[0]') + ' ';
      
      if(get(practitioner, 'name.family[0]')){
        result.name = result.name + get(practitioner, 'name.family[0]');
      } else {
        result.name = result.name + get(practitioner, 'name.family');
      }
      
      if(get(practitioner, 'name.suffix[0]')){
        result.name = result.name + ' ' + get(practitioner, 'name.suffix[0]');
      }
    } 
    //---------------------------------------------------------

    if(this.props.fhirVersion === 'v1.0.2'){
      // if (get(practitioner, 'telecom[0].value')) {
      //   result.phone = get(practitioner, 'telecom[0].value');
      // }
      // if (get(practitioner, 'telecom[0].use') ) {
      //   result.email = get(practitioner, 'telecom[0].use')
      // }
  
      result.qualificationId = get(practitioner, 'qualification[0].identifier[0].value');
      result.qualificationCode = get(practitioner, 'qualification[0].code.coding[0].code');
      result.qualificationStart = moment(get(practitioner, 'qualification[0].period.start')).format("MMM YYYY");
      result.qualificationEnd = moment(get(practitioner, 'qualification[0].period.end')).format("MMM YYYY");
      result.issuer = get(practitioner, 'qualification[0].issuer.display');
    
      result.text = get(practitioner, 'address[0].text')
      result.city = get(practitioner, 'address[0].city')
      result.state = get(practitioner, 'address[0].state')
      result.postalCode = get(practitioner, 'address[0].postalCode')

      //----------------------------------------------------------------
      // TODO REFACTOR:  ContactPoint
      // totally want to extract this

      let telecomArray = get(practitioner, 'telecom');
      telecomArray.forEach(function(telecomRecord){
        if(get(telecomRecord, 'system') === 'phone'){
          result.phone = get(telecomRecord, 'value');
        }
        if(get(telecomRecord, 'system') === 'email'){
          result.email = get(telecomRecord, 'value');
        }
      })
      //----------------------------------------------------------------
    }

    
    if(this.props.fhirVersion === 'v1.6.0'){
      // tbd
    }


    if(this.props.fhirVersion === '3.0.1'){
      // tbd      
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

    // number of items in the table should be set globally
    if (get(Meteor, 'settings.public.defaults.paginationLimit')) {
      options.limit = get(Meteor, 'settings.public.defaults.paginationLimit');
    }
    // but can be over-ridden by props being more explicit
    if(this.props.limit){
      options.limit = this.props.limit;      
    }

    if(this.props.data){
      // console.log('this.props.data', this.props.data);

      if(this.props.data.length > 0){              
        this.props.data.forEach(function(practitioner){
          data.practitioners.push(self.flattenPractitioner(practitioner));
        });  
      }
    } else {
      data.practitioners = Practitioners.find().map(function(practitioner){
        return self.flattenPractitioner(practitioner);
      });
    }
    
    if(process.env.NODE_ENV === "test") console.log("PractitionersTable[data]", data);
    return data;
  }

  rowClick(id){
    Session.set('practitionerUpsert', false);
    Session.set('selectedPractitionerId', id);
    Session.set('practitionerPageTabIndex', 2);
  }
  render () {
    let tableRows = [];
    //console.log('this.data.practitioners', this.data.practitioners)
    for (var i = 0; i < this.data.practitioners.length; i++) {
      tableRows.push(
      <tr className='practitionerRow' key={i} style={this.data.style.row} onClick={ this.rowClick.bind('this', this.data.practitioners[i]._id) }>
        <td className="name">{this.data.practitioners[i].name}</td>
        <td className="phone">{this.data.practitioners[i].phone}</td>
        <td className="email">{this.data.practitioners[i].email}</td>
        <td className="issuer">{this.data.practitioners[i].issuer}</td>
        <td className="qualificationCode">{this.data.practitioners[i].qualificationCode}</td>
        <td className="qualificationStart">{this.data.practitioners[i].qualificationStart}</td>
        <td className="qualificationEnd">{this.data.practitioners[i].qualificationEnd}</td>
        <td className="city">{this.data.practitioners[i].city}</td>
        <td className="state">{this.data.practitioners[i].state}</td>
        {/*<td className="barcode">{this.data.practitioners[i]._id}</td>*/}
      </tr>);
    }


    return(
      <Table id="practitionersTable" hover >
        <thead>
          <tr>
            <th className="name">Name</th>
            <th className="phone">Phone</th>
            <th className="email">Use</th>
            <th className="issuer">Issuer</th>
            <th className="qualificationCode">Credential</th>
            <th className="qualificationStart">Start</th>
            <th className="qualificationEnd">End</th>
            <th className="city">City</th>
            <th className="state">State</th>
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