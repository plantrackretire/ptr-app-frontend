import { Fragment, useState } from 'react';
import { isEqual } from 'lodash-es';
import './TreeView.css';


type TreeViewItem = { value: number, label: string, level?: number, parent?: number };

interface ITreeView {
  treeItems: TreeViewItem[],
  currentSelection: TreeViewItem[],
  handleTreeItemClick: (item: TreeViewItem) => void,
}

// Assumes items are ordered as they should be displayed in hierarchy.
// Expects each item to have: value, label, level, and parent.  If any optional items are excluded the three will be flat.
export const TreeView: React.FC<ITreeView> = ({ treeItems, currentSelection, handleTreeItemClick }) => {
  const [expandedNodes, setExpandedNodes] = useState<{ [index: number]: boolean }>(getInitialExpandedNodes(treeItems, currentSelection));

  const handleExpansionClicked = (value: number) => {
    if(value in expandedNodes) {
      const newExpandedNodes = { ...expandedNodes };
      delete newExpandedNodes[value];
      setExpandedNodes(newExpandedNodes);
    } else {
      const newExpandedNodes = { ...expandedNodes };
      newExpandedNodes[value] = true;
      setExpandedNodes(newExpandedNodes);
    }
  };

  const handleExpandAllClicked = () => {
    const expandedNodes: { [index: number]: boolean } = {};
    const nodesByParent = getNodesByParent(treeItems);
    Object.keys(nodesByParent).forEach(parent => expandedNodes[((parent as unknown) as number)] = true)
    setExpandedNodes(expandedNodes);
  }

  const handleCollapseAllClicked = () => {
    setExpandedNodes({});
  }

  const treeElements = generateHTMLStructure(treeItems, currentSelection, expandedNodes, handleExpansionClicked, handleTreeItemClick);

  return  (
            <div className="tree-view">
              <div className="tree-view--options">
                <button className='button-el' onClick={handleExpandAllClicked}><small>expand all</small></button>
                <button className='button-el' onClick={handleCollapseAllClicked}><small>collapse all</small></button>
              </div>
              <div className="tree-view--tree">
                {treeElements}
              </div>
            </div>
  );
};

const generateHTMLStructure = (treeItems: TreeViewItem[], currentSelection: TreeViewItem[], expandedNodes: { [index: number]: boolean }, 
    handleExpansionClicked: (value: number) => void, handleTreeItemClick: (item: TreeViewItem) => void) => {
    // Initialize an object to store nodes grouped by parentId
    const hierarchyPaddingMultiplier = 1.5;

    const nodesByParent = getNodesByParent(treeItems);

    // Recursive function to generate HTML structure
    function generateHTML(node: TreeViewItem) {
        // Check if node has children
        const children = nodesByParent[node.value] || [];

        // Generate HTML for children
        const childrenHTML = children.map(child => generateHTML(child));

        const isNodeExpanded = node.value in expandedNodes;

        // Generate HTML for current node and its children
        return  (
                <Fragment>
                <div className={"tree-view--node" + (children.length > 0 ? " tree-view--node-parent" : '')} 
                  style={{paddingLeft: ((node.level || 0) * hierarchyPaddingMultiplier) + "em"}}
                  
                >
                  { (children.length > 0) ? 
                    <button onClick={() => handleExpansionClicked(node.value)} className="button-el"><small>{isNodeExpanded ? "▼" : "►"}</small></button> : 
                    "" 
                  } 
                  <button onClick={() => handleTreeItemClick(node)} className={"button-el" + (currentSelection.find(el => isEqual(el, node) ) ? ' active' : '')}>
                    {node.label}
                  </button>
                </div>
                {
                  children.length > 0 ? 
                  <div className={"tree-view--node-children collapsable" + (isNodeExpanded ? " collapsable-expanded" : " collapsable-collapsed")}>{childrenHTML}</div> : 
                  ''
                }
                </Fragment>
                );
    }

    // Start from top-level nodes (parentId = null)
    const topLevelNodes = nodesByParent[0] || [];

    // Generate HTML for each top-level node
    const html = topLevelNodes.map(node => generateHTML(node));

    return html;
}

const getNodesByParent = (treeItems: TreeViewItem[]): { [index: number]: TreeViewItem[] } => {
    const nodesByParent: { [index: number]: TreeViewItem[] } = {};

    // Group nodes by parentId
    treeItems.forEach(node => {
      const parentId = node.parent || 0; // Use 0 as parentId for top-level nodes
      nodesByParent[parentId] = nodesByParent[parentId] || [];
      nodesByParent[parentId].push(node);
  });

  return nodesByParent;
}

// If there is a currentSelection then it should be visible, need to expand its parent and their parents all the way to the top of the tree.
const getInitialExpandedNodes = (treeItems: TreeViewItem[], currentSelection: TreeViewItem[]): { [index: number]: boolean } => {
  if(currentSelection.length === 0) {
    return {};
  }

  const expandedNodes: { [index: number]: boolean } = {};
  currentSelection.forEach(selection => {
    let currentParent = selection.parent || 0;
    while(currentParent !== 0) {
      expandedNodes[currentParent] = true;
      const parentItem = treeItems.find(item => item.value === currentParent);
      if(parentItem) {
        currentParent = parentItem.parent || 0;
      } else {
        currentParent = 0;
      }
    }
  });

  return expandedNodes;
}