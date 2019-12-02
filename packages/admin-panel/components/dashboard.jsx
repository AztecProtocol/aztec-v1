import React from 'react'

import { ApiClient, ViewHelpers } from 'admin-bro'
import { Label, Table, Columns, Column, WrapperBox, ValueBlock, StyledButton } from 'admin-bro/components'
import { colors } from 'admin-bro/style'

import DashboardHeader from './dashboard-header'
import {
    names as networksNames,
} from '../helpers/networks';
import capitalize from '../utils/capitalize';

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.h = new ViewHelpers()
  }

  componentDidMount() {
  }

  handleGoToAnotherNetwork({
      path,
  }) {
      window.location.href = `/${path}`;
  }

  render() {
    const networks = networksNames.map(title => ({ title: capitalize(title), path: title }));

    return (
      <React.Fragment>
        <DashboardHeader />
        <WrapperBox style={{ marginTop: '-100px', zIndex: 2 }}>
          <Columns>
            <Column width={8}>
              <Columns>
                <Column width={12}>
                  <WrapperBox border>
                    <h1>Supported Networks</h1>
                    <Table>
                      <thead>
                        <tr>
                          <th><Label>Network name</Label></th>
                          <th style={{ width: 200 }}><Label>Actions</Label></th>
                        </tr>
                      </thead>
                      <tbody>
                        {networks.map(n => (
                          <tr key={n.path}>
                            <td>{n.title} network</td>
                            <td>
                              <StyledButton
                                primary={true}
                                onClick={() => this.handleGoToAnotherNetwork(n)}
                              >
                                Show me this
                              </StyledButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </WrapperBox>
                </Column>
              </Columns>
            </Column>
          </Columns>
        </WrapperBox>
      </React.Fragment>
    )
  }
}