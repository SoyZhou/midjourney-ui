import React, { useContext, useEffect } from "react";
import { Divider, Typography } from "antd";
import AuthContext from "../stores/authContext";
import Link from "next/link";

const Index: React.FC = () => {
  const { user, login, authReady } = useContext(AuthContext);

  return (
    <div className="login-background p-10 flex items-center justify-around">
      <div>
        <Typography.Title>AI | MidJourney</Typography.Title>
        <Typography.Title>Powered Life</Typography.Title>
      </div>
      <Divider type="vertical" />
      <div>
        {authReady && user ? (
          <Link href="/midjourney">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-50 text-white border-white border-2 p-5 rounded-lg text-3xl cursor-pointer">
              Launch App
            </button>
          </Link>
        ) : (
          <button
            onClick={login}
            className="bg-white bg-opacity-20 hover:bg-opacity-50 text-white border-white border-2 p-5 rounded-lg text-3xl cursor-pointer"
          >
            Launch App
          </button>
        )}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  return {
    props: {
      ssr: false, // 禁用 SSR
    },
  };
}

export default Index;
