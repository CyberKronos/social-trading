import React, { PropTypes as T } from 'react'
import {Button} from 'react-bootstrap'
import AuthService from 'utils/AuthService'
import styles from './styles.module.css'

export class Home extends React.Component {
  static contextTypes = {
    router: T.object
  }

  static propTypes = {
    auth: T.instanceOf(AuthService)
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      profile: props.auth.getProfile()
    }
    props.auth.on('profile_updated', (newProfile) => {
      this.setState({profile: newProfile})
    })
  }

  logout(){
    this.props.auth.logout()
    this.context.router.push('/login');
  }

  addTwitterAcc() {
    console.log('twitter');
  }

  addInstagramAcc() {
    console.log('instagram');
  }

  render(){
    const { profile } = this.state
    console.log(profile);
    return (
      <div className={styles.root}>
        <h2>Home</h2>
        <p>Welcome!</p>
        <p>{ profile.username }</p>
        <p>{ profile.email }</p>
        <p>{ profile.user_metadata.fullname }</p>
        <Button onClick={this.addTwitterAcc.bind(this)}>Add Twitter Account</Button>
        <Button onClick={this.addInstagramAcc.bind(this)}>Add Instagram Account</Button>
        <Button onClick={this.logout.bind(this)}>Logout</Button>
      </div>
    )
  }
}

export default Home;
