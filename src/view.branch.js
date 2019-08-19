class BranchSwitch {
  constructor($dom, $html) {
    this.$dom = $dom;
    this.$html = $html;
    this.branches = [];
    $dom.find('.octotree-views').on('click', '.octotree-header-branch', this._showPopUp.bind(this));
  }

  setBranches(branches) {
    if (!this.branches.length) {
      this.branches = branches;
    }
  }

  _showPopUp() {
    this.$html
      .append(
        `
           <div class='modal-root'>
               <details-dialog class='anim-fade-in fast Box Box--overlay d-flex flex-column'>
                   <div class='Box-header'>
                   <button class='Box-btn-octicon btn-octicon float-right' data-branch-name='' type='button'>
                     <svg class='octicon octicon-x' viewBox='0 0 12 16' version='1.1' width='12' height='16'>
                     <path fill-rule='evenodd' d='M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 
                     8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z'></path>
                   </svg>
                   </button>
                       <h3 class='Box-title'>Switch to branch</h3>
                   </div>
               <div class='Box-body overflow-auto'>
                   <ul class='list-style-none position-relative'>
                       <li class='css-truncate source'>
                           ${this.branches
                             .map(
                               (branch) =>
                                 `<div data-branch-name='${branch}' class='octatree-branch-name'>${branch}</div>`
                             )
                             .join(' ')}
                           </label>
                       </li>
                   </ul>
               </div>
           </details-dialog>
       </div>`
      )
      .on('click', '.octatree-branch-name', this._handleModalClick.bind(this))
      .on('click', '.Box-btn-octicon', this._closePopUp);
  }

  _handleModalClick(event) {
    event.preventDefault();
    const clickedBranch = $(event.target).attr('data-branch-name');
    $(event.currentTarget).trigger(EVENT.BRANCH_SWITCHED, clickedBranch);
    this._closePopUp();
  }

  _closePopUp() {
    $('.modal-root').remove();
  }
}
