import React from 'react';
import { AmplifyProvider, Authenticator } from '@aws-amplify/ui-react';
import './index.css';
import '@aws-amplify/ui-react/styles.css';
import AppContent from './components/AppContent';
import theme from './theme';
import aws_exports from './aws-exports';
import Amplify from 'aws-amplify';

Amplify.configure(aws_exports);

const App = () => (
  <AmplifyProvider theme={theme}>
    <Authenticator>
      {({ signOut, user }) => <AppContent signOut={signOut} user={user} />}
    </Authenticator>
  </AmplifyProvider>
);

export default App;
