'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,X} from 'lucide-react';
const KEY='tibo-watchdog:altotrail-dismissed';
export function AltoTrailPromo(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{try{setVisible(sessionStorage.getItem(KEY)!=='1')}catch{setVisible(true)}},[]);
 function dismiss(){setVisible(false);try{sessionStorage.setItem(KEY,'1')}catch{/* Dismissal still works for this page when storage is unavailable. */}}
 if(!visible)return null;
 return <aside className="altotrail-promo" aria-label="AltoTrail advertisement"><div className="promo-copy"><span className="eyebrow">ADVERTISEMENT · FROM THE SITE OWNER</span><h2>Discover AltoTrail<span>.</span></h2><p>Curious? Take a look at AltoTrail.com.</p></div><a className="promo-link" href="https://altotrail.com" target="_blank" rel="noopener noreferrer">Visit AltoTrail <ArrowUpRight size={17}/></a><button className="promo-dismiss" type="button" onClick={dismiss} aria-label="Dismiss AltoTrail advertisement for this session" title="Hide for this session"><X size={20}/></button></aside>;
}
