// Entry point registered in package.json ("main"). Expo's app entry will be
// added in the screens commit; for now this keeps `expo start` from failing on
// a missing module.
import { AppRegistry } from 'react-native';
import App from './src/App';

AppRegistry.registerComponent('main', () => App);
