import PropTypes from 'prop-types';

function UserInfoCard({ user }) {
  if (!user) {
    return null;
  }

  return (
    <div className="user-info-card">
      <h2 className="card-title">User Information</h2>
      <div className="user-info-grid">
        <div className="info-item info-item-blue">
          <div className="info-icon">U</div>
          <div>
            <p className="info-label">Username</p>
            <p className="info-value">{user.username}</p>
          </div>
        </div>
        <div className="info-item info-item-purple">
          <div className="info-icon">@</div>
          <div>
            <p className="info-label">Email</p>
            <p className="info-value">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

UserInfoCard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }),
};

UserInfoCard.defaultProps = {
  user: null,
};

export default UserInfoCard;