'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { TabNavigation } from './tabs/tab-navigation';

const TabOverview = dynamic(() => import('./tabs/tab-overview').then((m) => ({ default: m.TabOverview })));
const TabSpecifications = dynamic(() => import('./tabs/tab-specifications').then((m) => ({ default: m.TabSpecifications })));
const TabDimensions = dynamic(() => import('./tabs/tab-dimensions').then((m) => ({ default: m.TabDimensions })));
const TabTorqueCurves = dynamic(() => import('./tabs/tab-torque-curves').then((m) => ({ default: m.TabTorqueCurves })));
const TabCustomDesign = dynamic(() => import('./tabs/tab-custom-design').then((m) => ({ default: m.TabCustomDesign })));
const TabDownloads = dynamic(() => import('./tabs/tab-downloads').then((m) => ({ default: m.TabDownloads })));
const TabReviews = dynamic(() => import('./tabs/tab-reviews').then((m) => ({ default: m.TabReviews })));
import {
  HASH_TO_TAB,
  TAB_BY_KEY,
  type ProductDetailImage,
  type ProductDetailSpecGroup,
  type ProductDetailTabKey,
  type ProductDocumentCard,
} from './tabs/shared';

type ProductDetailTabsProps = {
  description: string;
  specGroups: ProductDetailSpecGroup[];
  dimensionImages: ProductDetailImage[];
  torqueCurveImages: ProductDetailImage[];
  dimensionDocumentHref?: string;
  torqueCurveDocumentHref?: string;
  datasheetUrl?: string;
  quoteHref: string;
  customHref: string;
  contactPath: string;
  documentCards: ProductDocumentCard[];
  torqueCurveData?: unknown | null;
  configurationRules?: unknown | null;
};

export function ProductDetailTabs({
  description,
  specGroups,
  dimensionImages,
  torqueCurveImages,
  dimensionDocumentHref,
  torqueCurveDocumentHref,
  datasheetUrl,
  quoteHref,
  customHref,
  contactPath,
  documentCards,
  torqueCurveData,
  configurationRules,
}: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailTabKey>('description');
  const externalDocumentCount = documentCards.filter((d) => d.external).length;

  useEffect(() => {
    const syncTabFromHash = () => {
      const rawHash = window.location.hash.replace(/^#/, '');
      const nextTab = HASH_TO_TAB[rawHash];
      if (!nextTab) return;

      setActiveTab(nextTab);
      const canonicalHash = TAB_BY_KEY[nextTab].panelId;
      if (rawHash !== canonicalHash) {
        window.history.replaceState(window.history.state, '', `#${canonicalHash}`);
      }
    };

    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  const handleTabChange = (tabKey: ProductDetailTabKey) => {
    setActiveTab(tabKey);
    const nextHash = TAB_BY_KEY[tabKey].panelId;
    if (window.location.hash !== `#${nextHash}`) {
      window.history.replaceState(window.history.state, '', `#${nextHash}`);
    }
  };

  return (
    <>
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="tab-content-wrapper">
        <div
          id="detail-overview"
          className={activeTab === 'description' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-overview-tab"
          hidden={activeTab !== 'description'}
        >
          <TabOverview
            description={description}
            specGroups={specGroups}
            externalDocumentCount={externalDocumentCount}
            quoteHref={quoteHref}
            customHref={customHref}
          />
        </div>

        <div
          id="detail-specifications"
          className={activeTab === 'specifications' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-specifications-tab"
          hidden={activeTab !== 'specifications'}
        >
          <TabSpecifications specGroups={specGroups} />
        </div>

        <div
          id="detail-dimensions"
          className={activeTab === 'dimensions' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-dimensions-tab"
          hidden={activeTab !== 'dimensions'}
        >
          <TabDimensions
            dimensionImages={dimensionImages}
            dimensionDocumentHref={dimensionDocumentHref}
            quoteHref={quoteHref}
          />
        </div>

        <div
          id="detail-torque-curves"
          className={activeTab === 'torque-curves' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-torque-curves-tab"
          hidden={activeTab !== 'torque-curves'}
        >
          <TabTorqueCurves
            torqueCurveImages={torqueCurveImages}
            torqueCurveDocumentHref={torqueCurveDocumentHref}
            datasheetUrl={datasheetUrl}
            quoteHref={quoteHref}
            torqueCurveData={torqueCurveData}
          />
        </div>

        <div
          id="detail-custom-design"
          className={activeTab === 'custom-design' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-custom-design-tab"
          hidden={activeTab !== 'custom-design'}
        >
          <TabCustomDesign customHref={customHref} contactPath={contactPath} configurationRules={configurationRules} />
        </div>

        <div
          id="detail-downloads"
          className={activeTab === 'downloads' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-downloads-tab"
          hidden={activeTab !== 'downloads'}
        >
          <TabDownloads documentCards={documentCards} />
        </div>

        <div
          id="detail-reviews"
          className={activeTab === 'reviews' ? 'product-tab-content active' : 'product-tab-content'}
          role="tabpanel"
          aria-labelledby="detail-reviews-tab"
          hidden={activeTab !== 'reviews'}
        >
          <TabReviews quoteHref={quoteHref} contactPath={contactPath} />
        </div>
      </div>
    </>
  );
}
