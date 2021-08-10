import React, { useCallback } from 'react';
import { RouteComponentProps, Route } from 'react-router';
import { ChooseAddressPage } from './ChooseAddressPage';
import { AddressTokensPage } from './AddressTokensPage';
import { TokenDetailPage } from './TokenDetailPage';

import { useBodyClassName } from '../react-helpers';
import { ROUTES } from '../lib/constants';
import Header from '../components/Header';
import ScanCover from '../images/scan-cover.svg';
import Footer from '../components/Footer';

export const ScanPage: React.FC<RouteComponentProps> = ({ match, history, location }) => {
  const showBadges = useCallback(
    (addressOrENS: string, address: string) => {
      return history.push(`${match.path}scan/${addressOrENS}`, { address });
    },
    [history, match],
  );
  useBodyClassName('poap-app');

  const resolvePathname = (): string => {
    const { pathname } = history.location;
    if (pathname.includes('/claim')) return 'claim';
    if (pathname.includes('/token')) return 'token';
    return 'home';
  };

  return (
    <div className="landing">
      <Header sectionName="Scan" />
      <img src={ScanCover} alt={'scan cover'} className={'scan-cover'} />
      <Route exact path={ROUTES.home} render={() => <ChooseAddressPage onAccountDetails={showBadges} />} />
      <Route exact path={ROUTES.scanHome} render={() => <ChooseAddressPage onAccountDetails={showBadges} />} />
      <Route path={ROUTES.scan} component={AddressTokensPage} />
      <Route path={ROUTES.token} component={TokenDetailPage} />
      <Footer path={resolvePathname()} />
    </div>
  );
};
