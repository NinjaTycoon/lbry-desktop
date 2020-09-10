// @flow
import type { RowDataItem } from 'homepage';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import React from 'react';
import Page from 'component/page';
import Button from 'component/button';
import ClaimTilesDiscover from 'component/claimTilesDiscover';
import getHomepage from 'homepage';
import { useIsLargeScreen } from 'effects/use-screensize';

type Props = {
  authenticated: boolean,
  followedTags: Array<Tag>,
  subscribedChannels: Array<Subscription>,
};

function HomePage(props: Props) {
  const { followedTags, subscribedChannels, authenticated } = props;
  const isLargeScreen = useIsLargeScreen();
  const showPersonalizedChannels = (authenticated || !IS_WEB) && subscribedChannels && subscribedChannels.length > 0;
  const showPersonalizedTags = (authenticated || !IS_WEB) && followedTags && followedTags.length > 0;
  const showIndividualTags = showPersonalizedTags && followedTags.length < 5;
  const rowData: Array<RowDataItem> = getHomepage(
    authenticated,
    showPersonalizedChannels,
    showPersonalizedTags,
    subscribedChannels,
    followedTags,
    showIndividualTags
  );

  return (
    <Page fullWidthPage>
      {rowData.map(({ label, route, navigate, help, options = {}, hideRepostLabel = false }, index) => (
        <div key={label} className="claim-grid__wrapper">
          <h1 className="section__actions">
            <span
              className={classnames('claim-grid__title', {
                'claim-grid__title--first': index === 0,
              })}
            >
              {label}
            </span>
            {help}
          </h1>

          <ClaimTilesDiscover {...options} pageSize={isLargeScreen ? options.pageSize * (3 / 2) : options.pageSize} />
          {navigate && (
            <Button
              className="claim-grid__title--secondary"
              button="link"
              navigate={route || navigate}
              iconRight={ICONS.ARROW_RIGHT}
              label={__('View More')}
            />
          )}
        </div>
      ))}
    </Page>
  );
}

export default HomePage;
