import { CardText, CardTitle } from 'material-ui/Card';
import { Tab, Tabs } from 'material-ui/Tabs';
import { Paper } from 'material-ui/Paper';
import { GlassCard, VerticalCanvas, Glass } from 'meteor/clinical:glass-ui';

import PractitionerDetail  from './PractitionerDetail';
import PractitionersTable  from './PractitionersTable';

import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Package } from 'meteor/meteor';

import React  from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin  from 'react-mixin';

import { get } from 'lodash';

Session.setDefault('practitionerPageTabIndex', 1);
Session.setDefault('practitionerSearchFilter', '');
Session.setDefault('selectedPractitionerId', false);
Session.setDefault('blockchainPractitionerData', []);
Session.setDefault('fhirVersion', 'v1.0.2');

export class PractitionersPage extends React.Component {
  getMeteorData() {
    let data = {
      style: {
        opacity: Session.get('globalOpacity'),
        tab: {
          borderBottom: '1px solid lightgray',
          borderRight: 'none'
        }
      },
      tabIndex: Session.get('practitionerPageTabIndex'),
      practitionerSearchFilter: Session.get('practitionerSearchFilter'),
      selectedPractitionerId: Session.get('selectedPractitionerId'),
      blockchainData: Session.get('blockchainPractitionerData'),
      fhirVersion: Session.get('fhirVersion'),
      selectedPractitioner: false
    };

    if (Session.get('selectedPractitionerId')){
      data.selectedPractitioner = Practitioners.findOne({_id: Session.get('selectedPractitionerId')});
    } else {
      data.selectedPractitioner = false;
    }

    data.style = Glass.blur(data.style);
    data.style.appbar = Glass.darkroom(data.style.appbar);
    data.style.tab = Glass.darkroom(data.style.tab);

    if(process.env.NODE_ENV === "test") console.log("PractitionersPage[data]", data);
    return data;
  }

  // this could be a mixin
  handleTabChange(index){
    Session.set('practitionerPageTabIndex', index);
  }

  // this could be a mixin
  onNewTab(){
    process.env.DEBUG && console.log("onNewTab; we should clear things...");

    Session.set('selectedPractitionerId', false);
    Session.set('practitionerUpsert', false);
  }

  render() {
    var blockchainTab;
    if (get(Meteor, 'settings.public.defaults.displayBlockchainComponents')){
      blockchainTab = <Tab className="practitionerBlockchainHisotryTab" label='Blockchain' onActive={this.handleActive} style={this.data.style.tab} value={3}>
        <PractitionersTable showBarcodes={false} data={ this.data.blockchainData } />
      </Tab>                 
    }
    return (
      <div id="practitionersPage">
        <VerticalCanvas>
          <GlassCard height='auto'>
            <CardTitle
              title="Practitioners"
            />
            <CardText>
              <Tabs id="practitionersPageTabs" default value={this.data.tabIndex} onChange={this.handleTabChange} initialSelectedIndex={1} style={{borderRight: 'none'}} >
                <Tab className="newPractitionerTab" label='New' style={this.data.style.tab} onActive={ this.onNewTab } value={0} >
                  <PractitionerDetail 
                    id='newPractitioner'
                    fhirVersion={this.data.fhirVersion}
                    practitioner={ this.data.selectedPractitioner }
                    practitionerId={ this.data.selectedPractitionerId } />  
                </Tab>
                <Tab className="practitionerListTab" label='Practitioners' onActive={this.handleActive} style={this.data.style.tab} value={1}>
                  <PractitionersTable 
                    fhirVersion={this.data.fhirVersion} 
                    showBarcodes={false} />
                 </Tab>
                 <Tab className="practitionerDetailsTab" label='Detail' onActive={this.handleActive} style={this.data.style.tab} value={2}>
                  <PractitionerDetail 
                    id='practitionerDetails' 
                    practitioner={ this.data.selectedPractitioner }
                    practitionerId={ this.data.selectedPractitionerId } />  
                </Tab>
                { blockchainTab }
              </Tabs>
            </CardText>
          </GlassCard>
        </VerticalCanvas>
      </div>
    );
  }
}


ReactMixin(PractitionersPage.prototype, ReactMeteorData);

export default PractitionersPage;