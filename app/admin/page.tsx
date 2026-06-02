import { useState } from 'react'
import styles from './admin.module.css'

export default function AdminPage() {
  // 搜索筛选状态
  const [search, setSearch] = useState({
    key: '',
    useStatus: '全部',
    expireStatus: '全部',
    banStatus: '全部',
    start: '',
    end: ''
  })

  // 模拟许可证列表数据
  const tableData = [
    { id:1,code:'TK0Tp412K0ZopTe5S6pyk3hc4QwNrP',type:'天卡',useTime:'未使用',expireTime:'未生效',ban:'正常',validDay:1,left:0,admin:'九九520',create:'2026-05-14 19:58:43',lastLogin:'' },
    { id:2,code:'TK1L2CL0KWffy30J0vEpRDCYwQbSh',type:'天卡',useTime:'2026-05-28 20:45:25',expireTime:'2028-05-30 20:45:25',ban:'正常',validDay:1,left:0,admin:'九九520',create:'2026-05-14 19:59:43',lastLogin:'1.1.4.0' },
    { id:3,code:'TKIBbSC2PsoMKtyinSuh69o9fNSBZ',type:'天卡',useTime:'2026-05-30 19:44:23',expireTime:'2026-05-31 19:44:23',ban:'正常',validDay:1,left:0,admin:'九九520',create:'2026-05-14 19:59:43',lastLogin:'1.1.5.0' },
    { id:4,code:'ZK6UjOAdN1bY6mpaSrykZpu98iDg',type:'周卡',useTime:'2026-05-28 15:15:28',expireTime:'2026-06-03 22:15:28',ban:'正常',validDay:7,left:0,admin:'九九520',create:'2026-05-14 20:02:19',lastLogin:'1.1.4.0' },
  ]

  return (
    <div className={styles.layoutWrap}>
      {/* 左侧侧边导航 */}
      <aside className={styles.sidebar}>
        <div className={styles.sideTitle}>HAP-管理系统</div>
        <nav className={styles.sideMenu}>
          <div className={styles.menuItem}>首页</div>
          <div className={styles.menuItemActive}>许可证列表</div>
          <div className={styles.menuItem}>许可证生成</div>
          <div className={styles.menuItem}>管理员列表</div>
          <div className={styles.menuItem}>销售统计</div>
          <div className={styles.menuItem}>黑名单</div>
        </nav>
        <div className={styles.userTag}>九九520</div>
      </aside>

      {/* 右侧主内容区 */}
      <main className={styles.mainContent}>
        {/* 顶部搜索栏 */}
        <div className={styles.searchCard}>
          <div className={styles.searchTop}>
            <span className={styles.searchTit}>搜索</span>
            <div className={styles.searchBtnGroup}>
              <button className={styles.btnGray}>普通搜索</button>
              <button className={styles.btnGray}>高级搜索</button>
            </div>
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchItem}>
              <label>许可证序号</label>
              <input value={search.key} onChange={e=>setSearch({...search,key:e.target.value})} placeholder="可输入多行" className={styles.inp}/>
            </div>
            <div className={styles.searchItem}>
              <label>使用状态</label>
              <select className={styles.sel} value={search.useStatus} onChange={e=>setSearch({...search,useStatus:e.target.value})}>
                <option>全部</option><option>已使用</option><option>未使用</option>
              </select>
            </div>
            <div className={styles.searchItem}>
              <label>过期状态</label>
              <select className={styles.sel} value={search.expireStatus} onChange={e=>setSearch({...search,expireStatus:e.target.value})}>
                <option>全部</option><option>已过期</option><option>未生效</option>
              </select>
            </div>
            <div className={styles.searchItem}>
              <label>封禁状态</label>
              <select className={styles.sel} value={search.banStatus} onChange={e=>setSearch({...search,banStatus:e.target.value})}>
                <option>全部</option><option>正常</option><option>已封禁</option>
              </select>
            </div>
            <div className={styles.searchItem}>
              <label>生成时间</label>
              <input type="date" className={styles.inp} value={search.start} onChange={e=>setSearch({...search,start:e.target.value})}/>
              <span>~</span>
              <input type="date" className={styles.inp} value={search.end} onChange={e=>setSearch({...search,end:e.target.value})}/>
            </div>
            <div className={styles.searchBtnBox}>
              <button className={styles.btnGray}>重置</button>
              <button className={styles.btnPrimary}>搜索</button>
            </div>
          </div>
        </div>

        {/* 表格区域 */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeadBar}>
            <span className={styles.tableTit}>许可证列表</span>
            <div className={styles.tableLeftOpt}>
              <span>
                <input type="checkbox"/>全选
              </span>
              <span>未选择</span>
            </div>
            <div className={styles.tableRightOpt}>
              <select className={styles.selShort}>
                <option>全部许可证</option>
              </select>
            </div>
          </div>
          {/* 表格功能按钮 */}
          <div className={styles.optBtnWrap}>
            <button className={styles.btnOpt}>导入</button>
            <button className={styles.btnOpt}>导出</button>
            <button className={styles.btnOpt}>编辑</button>
            <button className={styles.btnOpt}>解禁</button>
            <button className={styles.btnOpt}>解封</button>
            <button className={styles.btnBan}>封禁</button>
            <button className={styles.btnDel}>删除</button>
          </div>
          {/* 数据表格 */}
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th><input type="checkbox"/></th>
                  <th>许可证序号</th>
                  <th>许可证类型</th>
                  <th>使用时间</th>
                  <th>过期时间</th>
                  <th>封禁状态</th>
                  <th>备注</th>
                  <th>有效期</th>
                  <th>剩余点数</th>
                  <th>管理员</th>
                  <th>生成时间</th>
                  <th>最后登录时间</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(item=>(
                  <tr key={item.id}>
                    <td><input type="checkbox"/></td>
                    <td className={styles.codeText}>{item.code}</td>
                    <td>{item.type}</td>
                    <td>{item.useTime}</td>
                    <td>{item.expireTime}</td>
                    <td><span className={styles.tagNormal}>{item.ban}</span></td>
                    <td></td>
                    <td>{item.validDay}天</td>
                    <td>{item.left}</td>
                    <td>{item.admin}</td>
                    <td>{item.create}</td>
                    <td>{item.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
