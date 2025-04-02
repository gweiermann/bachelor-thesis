"use client"

import dynamic from 'next/dynamic'

const ClientOnly = (props) => {
  const { children } = props

  return children;
};

export default dynamic(() => Promise.resolve(ClientOnly), {
  ssr: false,
})