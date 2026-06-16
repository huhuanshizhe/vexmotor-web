import type { ProductDetailTabKey } from './shared';
import { TAB_DEFINITIONS } from './shared';

type TabNavigationProps = {
  activeTab: ProductDetailTabKey;
  onTabChange: (tabKey: ProductDetailTabKey) => void;
};

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="detail-tab-nav" aria-label="Product details navigation" role="tablist">
      {TAB_DEFINITIONS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            id={`${tab.panelId}-tab`}
            type="button"
            className={isActive ? 'tab-button active' : 'tab-button'}
            role="tab"
            aria-selected={isActive}
            aria-controls={tab.panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
