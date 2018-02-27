import { CardText, CardTitle } from 'material-ui/Card';
import { Tab, Tabs } from 'material-ui/Tabs';
import { Paper } from 'material-ui/Paper';
import { GlassCard, VerticalCanvas, Glass } from 'meteor/clinical:glass-ui';

import PractitionerDetail  from './PractitionerDetail';
import PractitionersTable  from './PractitionersTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Package } from 'meteor/meteor';

import React  from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin  from 'react-mixin';

import { get } from 'lodash';

Session.setDefault('practitionerPageTabIndex', 1);
Session.setDefault('practitionerSearchFilter', '');
Session.setDefault('selectedPractitioner', false);
Session.setDefault('blockchainPractitionerData', []);

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
      currentPractitioner: Session.get('selectedPractitioner'),
      blockchainData: Session.get('blockchainPractitionerData')
    };

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

    Session.set('selectedPractitioner', false);
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
                  <PractitionerDetail id='newPractitioner' />
                </Tab>
                <Tab className="practitionerListTab" label='Practitioners' onActive={this.handleActive} style={this.data.style.tab} value={1}>
                  <PractitionersTable showBarcodes={false} />
                 </Tab>
                 <Tab className="practitionerDetailsTab" label='Detail' onActive={this.handleActive} style={this.data.style.tab} value={2}>
                  <PractitionerDetail id='practitionerDetails' />
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