

import PractitionersPage from './client/react/PractitionersPage';
import PractitionersTable from './client/react/PractitionersTable';
import { Practitioner, Practitioners, PractitionerSchema } from './lib/Practitioners';

var DynamicRoutes = [{
  'name': 'PractitionersPage',
  'path': '/practitioners',
  'component': PractitionersPage,
  'requireAuth': true
}];

var SidebarElements = [{
  'primaryText': 'Practitioners',
  'to': '/practitioners',
  'href': '/practitioners'
}];

export { 
  SidebarElements, 
  DynamicRoutes, 

  PractitionersPage,
  PractitionersTable
};


