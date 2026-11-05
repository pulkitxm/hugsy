#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsyRadialMenuModel {
    var actions: [HugsyRadialAction]
    var expanded: Bool

    init(actions: [HugsyRadialAction], expanded: Bool) {
      self.actions = actions
      self.expanded = expanded
    }
  }

  private struct HugsyRadialMenuHost: View {
    let model: HugsyRadialMenuModel
    let radius: CGFloat
    let onChange: (Bool) -> Void

    var body: some View {
      HugsyRadialMenu(
        actions: model.actions,
        isExpanded: Binding(
          get: { model.expanded },
          set: { value in
            model.expanded = value
            onChange(value)
          }), radius: radius)
    }
  }

  public final class HugsyRadialMenuViewController: UIViewController {
    public var didChangeExpansion: ((Bool) -> Void)?
    public var actions: [HugsyRadialAction] {
      get { model.actions }
      set { model.actions = newValue }
    }
    public var isExpanded: Bool {
      get { model.expanded }
      set { model.expanded = newValue }
    }
    private let model: HugsyRadialMenuModel
    private let radius: CGFloat

    public init(actions: [HugsyRadialAction], isExpanded: Bool = false, radius: CGFloat = 100) {
      self.model = HugsyRadialMenuModel(actions: actions, expanded: isExpanded)
      self.radius = radius
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsyRadialMenuHost(
          model: model, radius: radius,
          onChange: { [unowned self] value in didChangeExpansion?(value) }))
    }
  }
#endif
